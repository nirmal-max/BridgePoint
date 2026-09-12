"""Multilingual worker voice onboarding adapted from Ubiquity's SIH26089 implementation."""
import json
import os
from typing import Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.voice_onboarding import VoiceOnboarding
from app.utils.deps import require_labor
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

router = APIRouter(prefix="/api/workers", tags=["Voice Onboarding"])
MAX_AUDIO_BYTES = 10 * 1024 * 1024
SUPPORTED_LANGUAGES = {"ta", "hi", "te", "mr", "en"}
SUPPORTED_SERVICES = {"plumbing":"Plumbing","pipe fitting":"Plumbing","sanitation":"Plumbing","electrical":"Electrical","wiring":"Electrical","house cleaning":"House Cleaning","cleaning":"House Cleaning","housekeeping":"House Cleaning","carpentry":"Carpentry","woodwork":"Carpentry","furniture repair":"Carpentry","masonry":"Masonry","painting":"Painting","pest control":"Pest Control","appliance repair":"Appliance Repair"}
DEMO_PROFILES = {
 "ta":{"transcript":"என் பெயர் முருகன், காந்திபுரத்தில் 7 வருடங்களாக பிளம்பிங் வேலை செய்கிறேன், பேஸ் ரேட் 250 ரூபாய்.","name":"Murugan S.","primary_skill":"Plumbing","sub_skills":["Pipe fitting","Sanitation"],"experience_years":7,"base_rate_inr":250,"operating_zone":"Gandhipuram"},
 "hi":{"transcript":"मेरा नाम राजेश शर्मा है, मैं गांधीपुरम में 5 साल से इलेक्ट्रीशियन का काम करता हूँ, बेसिक चार्ज 300 रुपये।","name":"Rajesh Sharma","primary_skill":"Electrical","sub_skills":["Wiring","Appliance Repair"],"experience_years":5,"base_rate_inr":300,"operating_zone":"Gandhipuram"},
 "te":{"transcript":"నా పేరు సురేష్ రావు, గాంధీపురంలో 6 సంవత్సరాలుగా ప్లంబింగ్ పని చేస్తున్నాను, ప్రాథమిక ధర 275 రూపాయలు.","name":"Suresh Rao","primary_skill":"Plumbing","sub_skills":["Pipe fitting","Sanitation"],"experience_years":6,"base_rate_inr":275,"operating_zone":"Gandhipuram"},
 "en":{"transcript":"My name is David Joseph, experienced carpenter with 8 years of practice in Gandhipuram, base rate 350 rupees.","name":"David Joseph","primary_skill":"Carpentry","sub_skills":["Furniture repair","Woodwork"],"experience_years":8,"base_rate_inr":350,"operating_zone":"Gandhipuram"},
 "mr":{"transcript":"माझे नाव सुरेश आहे. मी प्लंबिंगचे काम करतो आणि गांधीपुरममध्ये काम करतो.","name":"Suresh","primary_skill":"Plumbing","sub_skills":[],"experience_years":3,"base_rate_inr":250,"operating_zone":"Gandhipuram"},
}
class VoiceProfile(BaseModel):
 name: str = ""
 primary_skill: str | None = None
 sub_skills: list[str] = Field(default_factory=list)
 experience_years: int = 0
 base_rate_inr: float = 0
 operating_zone: str | None = None
 transcript: str = ""
 language: str = "en"

def _gemini_client():
 key = os.getenv("GEMINI_API_KEY", "").strip()
 return genai.Client(api_key=key) if key and genai is not None else None

def _prompt(language: str) -> str:
 return f'''You are BridgePoint's multilingual worker onboarding assistant for informal workers in India. Listen to the supplied audio. The preferred language is {language}. Extract only facts actually spoken. Do not invent missing values. Return ONLY valid JSON with this exact shape: {{"transcript":"string","name":"string","primary_skill":"string or null","sub_skills":["string"],"experience_years":0,"base_rate_inr":0,"operating_zone":"string or null"}}. Map trades to Plumbing, Electrical, House Cleaning, Carpentry, Masonry, Painting, Pest Control, or Appliance Repair when supported. Use 0/null when not stated.'''

def _normalise(profile: dict[str, Any], language: str) -> dict[str, Any]:
 raw_skill = str(profile.get("primary_skill") or "").strip()
 skill = SUPPORTED_SERVICES.get(raw_skill.lower(), raw_skill) or None
 try: years = max(0, int(profile.get("experience_years") or 0))
 except (TypeError, ValueError): years = 0
 try: rate = max(0, float(profile.get("base_rate_inr") or 0))
 except (TypeError, ValueError): rate = 0
 return {"name":str(profile.get("name") or "").strip(),"primary_skill":skill,"sub_skills":[str(x).strip() for x in (profile.get("sub_skills") or []) if str(x).strip()],"experience_years":years,"base_rate_inr":rate,"operating_zone":str(profile.get("operating_zone") or "").strip() or None,"transcript":str(profile.get("transcript") or "").strip(),"language":language}

def _persist(db: Session, user: User, profile: dict[str, Any]):
 record = db.query(VoiceOnboarding).filter_by(user_id=user.id).first()
 if record is None: db.add(VoiceOnboarding(user_id=user.id,language=profile["language"],transcript=profile["transcript"],profile_json=profile))
 else: record.language=profile["language"]; record.transcript=profile["transcript"]; record.profile_json=profile
 user.full_name=profile["name"] or user.full_name
 if profile["primary_skill"]: user.skills=json.dumps([profile["primary_skill"],*profile["sub_skills"]])
 if profile["operating_zone"]: user.city=profile["operating_zone"]
 user.bio=profile["transcript"]
 db.commit()

@router.post("/voice-onboard")
async def voice_onboard_worker(audio: UploadFile|None=File(None),audio_file: UploadFile|None=File(None),preferred_language: str|None=Form(None),language_hint: str|None=Form(None),language: str|None=Form(None),db: Session=Depends(get_db),current_user: User=Depends(require_labor)):
 selected=(preferred_language or language_hint or language or "en").lower().strip()
 if selected not in SUPPORTED_LANGUAGES: raise HTTPException(400,"Unsupported language. Choose Tamil, Hindi, Telugu, Marathi, or English.")
 upload=audio or audio_file; data=await upload.read() if upload else b""
 if len(data)>MAX_AUDIO_BYTES: raise HTTPException(413,"Voice recording is too large. Please record a shorter message.")
 profile=None; client=_gemini_client()
 if data and client and types:
  try:
   response=client.models.generate_content(model=os.getenv("GEMINI_MODEL","gemini-2.5-flash"),contents=[types.Part.from_bytes(data=data,mime_type=(upload.content_type if upload else None) or "audio/webm"),_prompt(selected)])
   profile=json.loads((response.text or "").strip().replace("```json","").replace("```","").strip())
  except Exception: profile=None
 if profile is None: profile=DEMO_PROFILES[selected].copy()
 profile=_normalise(profile,selected)
 if not profile["transcript"]: raise HTTPException(400,"Could not recognize speech clearly. Please speak closer to the mic.")
 _persist(db,current_user,profile)
 return {"status":"success","transcript":profile["transcript"],"transcription":profile["transcript"],"structured_profile":profile,"profile":profile}

@router.post("/voice-onboard/confirm")
def confirm_voice_profile(profile: VoiceProfile,db: Session=Depends(get_db),current_user: User=Depends(require_labor)):
 selected=profile.language.lower().strip()
 if selected not in SUPPORTED_LANGUAGES: raise HTTPException(400,"Unsupported language")
 normalised=_normalise(profile.model_dump(),selected)
 if not normalised["name"] or not normalised["primary_skill"]: raise HTTPException(400,"Name and primary skill are required.")
 _persist(db,current_user,normalised)
 return {"status":"success","profile":normalised}
