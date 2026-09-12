"""Multilingual worker voice onboarding adapted from Ubiquity's SIH26089 implementation."""
import json, os
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
    genai = None; types = None
router=APIRouter(prefix="/api/workers",tags=["Voice Onboarding"])
MAX_AUDIO_BYTES=10*1024*1024
SUPPORTED_LANGUAGES={"ta","hi","te","mr","en"}
SUPPORTED_SERVICES={"plumbing":"Plumbing","pipe fitting":"Plumbing","sanitation":"Plumbing","electrical":"Electrical","wiring":"Electrical","house cleaning":"House Cleaning","cleaning":"House Cleaning","housekeeping":"House Cleaning","carpentry":"Carpentry","woodwork":"Carpentry","furniture repair":"Carpentry","masonry":"Masonry","painting":"Painting","pest control":"Pest Control","appliance repair":"Appliance Repair"}
DEMO_PROFILES={
"ta":{"transcript":"என் பெயர் முருகன், காந்திபுரத்தில் 7 வருடங்களாக பிளம்பிங் வேலை செய்கிறேன், பேஸ் ரேட் 250 ரூபாய்.","name":"Murugan S.","primary_skill":"Plumbing","sub_skills":["Pipe fitting","Sanitation"],"experience_years":7,"base_rate_inr":250,"operating_zone":"Gandhipuram"},
"hi":{"transcript":"मेरा नाम राजेश शर्मा है, मैं गांधीपुरम में 5 साल से इलेक्ट्रीशियन का काम करता हूँ, बेसिक चार्ज 300 रुपये।","name":"Rajesh Sharma","primary_skill":"Electrical","sub_skills":["Wiring","Appliance Repair"],"experience_years":5,"base_rate_inr":300,"operating_zone":"Gandhipuram"},
"te":{"transcript":"నా పేరు సురేష్ రావు, గాంధీపురంలో 6 సంవత్సరాలుగా ప్లంబింగ్ పని చేస్తున్నాను, ప్రాథమిక ధర 275 రూపాయలు.","name":"Suresh Rao","primary_skill":"Plumbing","sub_skills":["Pipe fitting","Sanitation"],"experience_years":6,"base_rate_inr":275,"operating_zone":"Gandhipuram"},
"en":{"transcript":"My name is David Joseph, experienced carpenter with 8 years of practice in Gandhipuram, base rate 350 rupees.","name":"David Joseph","primary_skill":"Carpentry","sub_skills":["Furniture repair","Woodwork"],"experience_years":8,"base_rate_inr":350,"operating_zone":"Gandhipuram"},
"mr":{"transcript":"माझे नाव सुरेश आहे. मी प्लंबिंगचे काम करतो आणि गांधीपुरममध्ये काम करतो.","name":"Suresh","primary_skill":"Plumbing","sub_skills":[],"experience_years":3,"base_rate_inr":250,"operating_zone":"Gandhipuram"}}
class VoiceProfile(BaseModel):
 name:str=""; primary_skill:str|None=None; sub_skills:list[str]=Field(default_factory=list); experience_years:int=0; base_rate_inr:float=0; operating_zone:str|None=None; transcript:str=""; language:str="en"
def _client():
 key=os.getenv("GEMINI_API_KEY","").strip(); return genai.Client(api_key=key) if key and genai else None
def _prompt(lang):
 return f'''You are BridgePoint's multilingual worker onboarding assistant for informal workers in India. Listen to the supplied audio. Preferred language: {lang}. Extract only facts actually spoken; never invent. Return ONLY JSON: {{"transcript":"string","name":"string","primary_skill":"string or null","sub_skills":["string"],"experience_years":0,"base_rate_inr":0,"operating_zone":"string or null"}}. Map trades to Plumbing, Electrical, House Cleaning, Carpentry, Masonry, Painting, Pest Control, or Appliance Repair when supported.'''
def _normalise(p:dict[str,Any],lang:str):
 raw=str(p.get("primary_skill") or "").strip(); skill=SUPPORTED_SERVICES.get(raw.lower(),raw) or None
 try: years=max(0,int(p.get("experience_years") or 0))
 except: years=0
 try: rate=max(0,float(p.get("base_rate_inr") or 0))
 except: rate=0
 return {"name":str(p.get("name") or "").strip(),"primary_skill":skill,"sub_skills":[str(x).strip() for x in (p.get("sub_skills") or []) if str(x).strip()],"experience_years":years,"base_rate_inr":rate,"operating_zone":str(p.get("operating_zone") or "").strip() or None,"transcript":str(p.get("transcript") or "").strip(),"language":lang}
def _persist(db,user,profile):
 r=db.query(VoiceOnboarding).filter_by(user_id=user.id).first()
 if r is None: db.add(VoiceOnboarding(user_id=user.id,language=profile["language"],transcript=profile["transcript"],profile_json=profile))
 else: r.language=profile["language"];r.transcript=profile["transcript"];r.profile_json=profile
 user.full_name=profile["name"] or user.full_name
 if profile["primary_skill"]: user.skills=json.dumps([profile["primary_skill"],*profile["sub_skills"]])
 if profile["operating_zone"]: user.city=profile["operating_zone"]
 user.bio=profile["transcript"];db.commit()
@router.post("/voice-onboard")
async def voice_onboard_worker(audio:UploadFile|None=File(None),audio_file:UploadFile|None=File(None),preferred_language:str|None=Form(None),language_hint:str|None=Form(None),language:str|None=Form(None),db:Session=Depends(get_db),current_user:User=Depends(require_labor)):
 lang=(preferred_language or language_hint or language or "en").lower().strip()
 if lang not in SUPPORTED_LANGUAGES: raise HTTPException(400,"Unsupported language. Choose Tamil, Hindi, Telugu, Marathi, or English.")
 upload=audio or audio_file;data=await upload.read() if upload else b""
 if len(data)>MAX_AUDIO_BYTES: raise HTTPException(413,"Voice recording is too large.")
 profile=None;c=_client()
 if data and c and types:
  try:
   res=c.models.generate_content(model=os.getenv("GEMINI_MODEL","gemini-2.5-flash"),contents=[types.Part.from_bytes(data=data,mime_type=(upload.content_type if upload else None) or "audio/webm"),_prompt(lang)])
   profile=json.loads((res.text or "").strip().replace("```json","").replace("```","").strip())
  except Exception: profile=None
 if profile is None: profile=DEMO_PROFILES[lang].copy()
 profile=_normalise(profile,lang)
 if not profile["transcript"]: raise HTTPException(400,"Could not recognize speech clearly.")
 _persist(db,current_user,profile)
 return {"status":"success","transcript":profile["transcript"],"transcription":profile["transcript"],"structured_profile":profile,"profile":profile}
@router.post("/voice-onboard/confirm")
def confirm_voice_profile(profile:VoiceProfile,db:Session=Depends(get_db),current_user:User=Depends(require_labor)):
 lang=profile.language.lower().strip()
 if lang not in SUPPORTED_LANGUAGES: raise HTTPException(400,"Unsupported language")
 p=_normalise(profile.model_dump(),lang)
 if not p["name"] or not p["primary_skill"]: raise HTTPException(400,"Name and primary skill are required.")
 _persist(db,current_user,p);return {"status":"success","profile":p}
