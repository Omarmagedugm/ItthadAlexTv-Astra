"""Rebuild the original procedural Hamido concept; NumPy is needed only at build time.
Y-up, faces +Z, metres. Mesh extras describe rigid articulation and wardrobe slots.
"""
from pathlib import Path
import json, struct
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/games/ittihadawy/models/hamido-prototype.glb'
blob=bytearray()
g={'asset':{'version':'2.0','generator':'ITTIHADAWY Hamido concept v1'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':'Hamido_Concept','children':[]}],'meshes':[],'materials':[],'accessors':[],'bufferViews':[]}
colors={'skin':(.45,.18,.075),'skinLight':(.54,.235,.105),'skinShadow':(.27,.082,.028),'mouth':(.105,.018,.01),'lip':(.30,.07,.026),'hair':(.045,.022,.01),'white':(.91,.93,.88),'green':(.012,.30,.073),'greenDark':(.008,.18,.035),'lime':(.75,.90,.012),'limeDark':(.27,.38,.007),'blue':(.008,.22,.66),'lens':(.012,.065,.16),'eye':(.96,.95,.90),'iris':(.19,.075,.018),'black':(.01,.014,.018),'sole':(.52,.55,.48),'gold':(.78,.56,.04)}
for name,c in colors.items():
 g['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':[*c,1],'metallicFactor':0,'roughnessFactor':.22 if name=='lens' else .85},'doubleSided':True})
def accessor(a,kind,component=5126):
 a=np.asarray(a,dtype='<f4' if component==5126 else '<u4');blob.extend(b'\0'*((-len(blob))%4));off=len(blob);blob.extend(a.tobytes());i=len(g['bufferViews']);g['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':a.nbytes});g['accessors'].append({'bufferView':i,'componentType':component,'count':len(a),'type':kind,'min':a.min(axis=0).tolist(),'max':a.max(axis=0).tolist()});return len(g['accessors'])-1
def mesh(name,v,f,color,bone='head',slot=''):
 v=np.asarray(v,float);f=np.asarray(f,int);n=np.zeros_like(v)
 normals=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
 for k in range(3):np.add.at(n,f[:,k],normals)
 n/=np.maximum(np.linalg.norm(n,axis=1)[:,None],1e-9)
 g['meshes'].append({'name':name,'extras':{'bone':bone,'slot':slot},'primitives':[{'attributes':{'POSITION':accessor(v,'VEC3'),'NORMAL':accessor(n,'VEC3')},'indices':accessor(f.flatten(),'SCALAR',5125),'material':list(colors).index(color)}]})
 g['nodes'][0]['children'].append(len(g['nodes']));g['nodes'].append({'name':name,'mesh':len(g['meshes'])-1})
def ell(name,pos,scale,col,bone='head',slot='',N=24,M=16,upper=np.pi):
 v=[];f=[]
 for j in range(M+1):
  a=upper*j/M
  for i in range(N):
   b=2*np.pi*i/N;v.append(np.asarray(pos)+np.asarray(scale)*[np.sin(a)*np.cos(b),np.cos(a),np.sin(a)*np.sin(b)])
 for j in range(M):
  for i in range(N):
   a=j*N+i;b=j*N+(i+1)%N;f.extend([[a,b,a+N],[b,b+N,a+N]])
 mesh(name,v,f,col,bone,slot)
def tube(name,pts,radii,col,bone='head',slot='',N=16):
 pts=np.asarray(pts,float);v=[];f=[]
 for k,p in enumerate(pts):
  t=pts[min(k+1,len(pts)-1)]-pts[max(k-1,0)];t/=np.linalg.norm(t);u=np.cross(t,[0,0,1] if abs(t[2])<.9 else [1,0,0]);u/=np.linalg.norm(u);w=np.cross(t,u)
  for i in range(N):v.append(p+radii[k]*(u*np.cos(i*2*np.pi/N)+w*np.sin(i*2*np.pi/N)))
 for j in range(len(pts)-1):
  for i in range(N):
   a=j*N+i;b=j*N+(i+1)%N;f.extend([[a,b,a+N],[b,b+N,a+N]])
 mesh(name,v,f,col,bone,slot)
def ring(name,center,rx,ry,r,col,bone='head',slot='eyewear'):
 pts=[[center[0]+rx*np.cos(a),center[1]+ry*np.sin(a),center[2]] for a in np.linspace(0,2*np.pi,41)];tube(name,pts,[r]*len(pts),col,bone,slot,N=10)
# Stocky supporter silhouette, loose black shalwar and white sleeveless vest.
for s,side in [(-1,'left'),(1,'right')]:
 x=s*.18;leg=side+'Leg';shin=side+'Shin'
 ell(side+'_shalwar',[x,.65,0],[.205,.30,.18],'black',leg,'shorts')
 ell(side+'_lower_shalwar',[x,.31,0],[.16,.24,.14],'black',shin,'shorts')
 for j in range(3):
  tube(side+'_pleat'+str(j),[[x+(j-1)*.07,.84,.15],[x+(j-1)*.085,.65,.18],[x+(j-1)*.06,.48,.13]],[.008,.012,.006],'black',leg,'shorts',N=8)
 ell(side+'_sole',[x,.045,.07],[.15,.045,.24],'white',shin,'shoes')
 ell(side+'_shoe',[x,.10,.06],[.145,.08,.23],'black',shin,'shoes')
 for j in range(4):tube(side+'_lace'+str(j),[[x-.07,.17,.08+j*.03],[x+.07,.17,.08+j*.03]],[.006,.006],'white',shin,N=8)
ell('hips',[0,.86,0],[.30,.15,.20],'black','body','shorts')
ell('green_shirt',[0,1.19,0],[.34,.38,.225],'green','torso','shirt',N=36,M=24)
# Open vest follows body surface, with open centre front.
for s in [-1,1]:
 v=[];f=[];N=24;M=12
 for j in range(M+1):
  y=.93+j*.57/M;section=np.sqrt(max(.01,1-((y-1.19)/.38)**2));w=.34*section+.012;depth=.225*section+.012
  for i in range(N+1):
   a=.32+(np.pi-.32)*i/N
   v.append([s*w*np.sin(a),y,depth*np.cos(a)])
 for j in range(M):
  for i in range(N):
   k=j*(N+1)+i;f.extend([[k,k+1,k+N+1],[k+1,k+N+2,k+N+1]])
 mesh('vest_panel'+str(s),v,f,'white','torso')
 tube('vest_trim'+str(s),[[s*.10,.93,.222],[s*.11,1.20,.226],[s*.10,1.42,.222]],[.009]*3,'sole','torso',N=10)
ell('neck',[0,1.49,0],[.105,.13,.10],'skin','head')
for j in range(3):ell('shirt_button'+str(j),[0,1.38-j*.04,.227],[.009,.009,.005],'gold','torso',N=10,M=8)
for s,side in [(-1,'left'),(1,'right')]:
 arm=side+'Arm';fore=side+'Forearm'
 ell(side+'_upper_sleeve',[s*.335,1.32,0],[.145,.23,.145],'green',arm,'shirt')
 ell(side+'_elbow',[s*.44,1.15,.015],[.115,.12,.115],'green',fore,'shirt')
 tube(side+'_fore_sleeve',[[s*.44,1.15,.015],[s*.47,1.03,.03],[s*.48,.94,.05]],[.113,.102,.08],'green',fore,'shirt')
 for j in range(2):tube(side+'_white_stripe'+str(j),[[s*(.445+j*.02),1.13-j*.10,.018+j*.015],[s*(.453+j*.02),1.095-j*.10,.024+j*.015]],[.114-j*.01,.111-j*.01],'white',fore)
 ell(side+'_hand',[s*.48,.88,.06],[.073,.095,.045],'skin',fore)
 for j in range(4):ell(side+'_finger'+str(j),[s*.48+(j-1.5)*.027,.814+abs(j-1.5)*.009,.076],[.016,.043,.022],'skin',fore,N=12,M=8)
 ell(side+'_thumb',[s*.42,.89,.095],[.029,.052,.028],'skinLight',fore,N=16,M=10)
# Broad mature smiling face, short greying side hair and white bucket hat.
ell('head',[0,1.74,0],[.20,.245,.18],'skin',N=40,M=28)
ell('jaw',[0,1.60,.045],[.155,.13,.125],'skin')
ell('chin',[0,1.54,.115],[.092,.053,.049],'skinLight')
for s in [-1,1]:
 ell('ear'+str(s),[s*.205,1.73,0],[.043,.073,.031],'skin')
 ell('inner_ear'+str(s),[s*.216,1.73,.025],[.023,.047,.009],'skinShadow')
 ell('side_hair'+str(s),[s*.18,1.85,-.03],[.027,.09,.10],'hair')
 ell('cheek'+str(s),[s*.115,1.67,.132],[.071,.067,.038],'skinLight')
 ell('eye_socket'+str(s),[s*.082,1.79,.151],[.061,.043,.025],'skinShadow')
 ell('eye'+str(s),[s*.082,1.79,.169],[.048,.028,.019],'eye')
 ell('iris'+str(s),[s*.081,1.79,.185],[.020,.024,.007],'iris')
 ell('pupil'+str(s),[s*.081,1.79,.191],[.010,.014,.004],'black')
 ell('glint'+str(s),[s*.081-.006,1.80,.195],[.005,.006,.002],'white',N=12,M=8)
 tube('brow'+str(s),[[s*.035,1.848,.159],[s*.08,1.86,.15],[s*.13,1.844,.129]],[.011,.016,.01],'hair',N=12)
 tube('smile_crease'+str(s),[[s*.07,1.69,.178],[s*.11,1.65,.17],[s*.10,1.61,.154]],[.003,.004,.002],'skinShadow',N=8)
ell('nose',[0,1.745,.18],[.037,.068,.037],'skin')
ell('nose_tip',[0,1.704,.214],[.05,.035,.041],'skinLight')
ell('smile',[0,1.633,.17],[.092,.042,.025],'mouth')
ell('teeth',[0,1.647,.192],[.077,.014,.009],'eye')
tube('lower_lip',[[-.07,1.615,.179],[0,1.601,.182],[.07,1.615,.179]],[.006,.009,.006],'lip',N=12)
# Bucket crown and flared brim (not a baseball cap).
tube('bucket_crown',[[0,1.91,0],[0,2.04,0]],[.216,.17],'white','head','headwear',N=48)
ell('bucket_top',[0,2.04,0],[.17,.027,.17],'white','head','headwear',N=40,M=12)
tube('bucket_brim',[[0,1.91,0],[0,1.855,0]],[.217,.278],'white','head','headwear',N=48)
for y,r in [(1.94,.209),(1.965,.20),(1.855,.278)]:
 pts=[[r*np.cos(a),y,r*np.sin(a)] for a in np.linspace(0,2*np.pi,49)]
 tube('hat_stitch'+str(y),pts,[.003]*49,'sole','head','headwear',N=6)
# Compact blue darbuka at the hip, attached to torso so running hands remain free.
tube('darbuka_shell',[[.32,1.08,.27],[.40,1.00,.29],[.49,.89,.30],[.57,.83,.31]],[.16,.13,.07,.105],'blue','torso',N=32)
# Rims and skins use the same axis as the drum shell.
axis=np.array([-.25,.25,-.04]);axis/=np.linalg.norm(axis)
u=np.cross(axis,[0,0,1]);u/=np.linalg.norm(u);w=np.cross(axis,u)
for name,center,r in [('drum_skin',np.array([.32,1.08,.27]),.16),('drum_base',np.array([.57,.83,.31]),.105)]:
 pts=[center+r*(u*np.cos(a)+w*np.sin(a)) for a in np.linspace(0,2*np.pi,41)]
 tube(name+'_rim',pts,[.012]*41,'sole','torso',N=8)
 v=[center]+pts[:-1];faces=[[0,i+1,(i+1)%40+1] for i in range(40)]
 mesh(name,v,faces,'lens','torso')
 for i in range(8):
  a=i*np.pi/4;pos=center+r*.94*(u*np.cos(a)+w*np.sin(a))+axis*.008
  ell(name+'_bolt'+str(i),pos,[.008]*3,'black','torso',N=8,M=6)
# Explicit joints use the existing engine's animation pivots.
g['extras']={'character':'hamido','status':'Procedural reference-inspired prototype; rigid articulation, approximate likeness.','scale':1.4,'joints':{
 'body':[None,[0,0,0],'bodyPivot'],'torso':['body',[0,.86,0],'torsoPivot'],'head':['torso',[0,1.49,0],'headPivot'],
 'leftArm':['torso',[-.30,1.43,0],'leftArmPivot'],'leftForearm':['leftArm',[-.44,1.15,.015],'leftForearmPivot'],
 'rightArm':['torso',[.30,1.43,0],'rightArmPivot'],'rightForearm':['rightArm',[.44,1.15,.015],'rightForearmPivot'],
 'leftLeg':['body',[-.18,.86,0],'leftLegPivot'],'leftShin':['leftLeg',[-.18,.47,0],'leftShinPivot'],
 'rightLeg':['body',[.18,.86,0],'rightLegPivot'],'rightShin':['rightLeg',[.18,.47,0],'rightShinPivot']}}
g['buffers']=[{'byteLength':len(blob)}];data=json.dumps(g,separators=(',',':')).encode();data+=b' '*((-len(data))%4);blob.extend(b'\0'*((-len(blob))%4));result=struct.pack('<4sII',b'glTF',2,28+len(data)+len(blob))+struct.pack('<I4s',len(data),b'JSON')+data+struct.pack('<I4s',len(blob),b'BIN\0')+blob
OUT.write_bytes(result)
print(json.dumps({'file':str(OUT),'size':len(result),'meshes':len(g['meshes'])}))
