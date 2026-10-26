"""Rebuild the original procedural Lazo concept; NumPy is needed only at build time.
Y-up, faces +Z, metres. Mesh extras describe rigid articulation and wardrobe slots.
"""
from pathlib import Path
import json, struct
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/games/ittihadawy/models/lazo-prototype.glb'
blob=bytearray()
g={'asset':{'version':'2.0','generator':'ITTIHADAWY Lazo concept v1'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':'Lazo_Concept','children':[]}],'meshes':[],'materials':[],'accessors':[],'bufferViews':[]}
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
# Slim, long-legged silhouette with a gently loose football shirt.
for s,side in [(-1,'left'),(1,'right')]:
 x=s*.135;leg=side+'Leg';shin=side+'Shin'
 ell(side+'_upper_trouser',[x,.73,0],[.13,.28,.12],'green',leg,'shorts')
 ell(side+'_knee',[x,.51,.012],[.113,.075,.108],'green',leg,'shorts')
 ell(side+'_lower_trouser',[x,.33,0],[.11,.235,.105],'green',shin,'shorts')
 tube(side+'_cuff',[[x,.15,0],[x,.19,0]],[.091,.102],'greenDark',shin,'shorts')
 ell(side+'_sole',[x,.045,.065],[.125,.045,.235],'white',shin,'shoes')
 ell(side+'_sneaker',[x,.095,.055],[.12,.075,.22],'green',shin,'shoes')
 for j in range(3):tube(side+'_lace'+str(j),[[x-.065,.158,.08+j*.032],[x+.065,.158,.08+j*.032]],[.006,.006],'white',shin,'',N=8)
ell('hips',[0,.94,0],[.24,.13,.13],'green','body','shorts')
# Lathed tailored jersey with smooth shoulder and waist sections.
rings=[(.96,.24,.143),(1.02,.235,.14),(1.16,.21,.13),(1.31,.22,.135),(1.43,.26,.14),(1.49,.23,.12),(1.53,.105,.085)]
v=[];f=[];N=40
for y,rx,rz in rings:
 for a in np.linspace(0,2*np.pi,N,endpoint=False):v.append([rx*np.cos(a),y,rz*np.sin(a)])
for j in range(len(rings)-1):
 for i in range(N):
  a=j*N+i;b=j*N+(i+1)%N;f.extend([[a,b,a+N],[b,b+N,a+N]])
mesh('white_jersey',v,[list(reversed(face)) for face in f],'white','torso','shirt')
ell('neck',[0,1.565,0],[.072,.135,.072],'skin','head')
# Collar ring lies horizontally around the neckline.
pts=[[.108*np.cos(a),1.526,.088*np.sin(a)] for a in np.linspace(0,2*np.pi,40)]
tube('green_collar',pts,[.016]*40,'green','torso',N=10)
for s,side in [(-1,'left'),(1,'right')]:
 arm=side+'Arm';fore=side+'Forearm'
 ell(side+'_sleeve',[s*.265,1.425,0],[.115,.14,.115],'white',arm,'shirt')
 tube(side+'_sleeve_trim',[[s*.29,1.335,0],[s*.30,1.31,0]],[.10,.098],'green',arm,N=20)
 tube(side+'_upper_arm',[[s*.30,1.34,0],[s*.335,1.23,.005],[s*.35,1.15,.012]],[.073,.068,.061],'skin',arm)
 ell(side+'_elbow',[s*.35,1.15,.012],[.062,.067,.061],'skin',fore)
 tube(side+'_forearm',[[s*.35,1.15,.012],[s*.365,1.03,.03],[s*.38,.94,.05]],[.063,.062,.043],'skin',fore)
 ell(side+'_hand',[s*.38,.90,.055],[.056,.079,.032],'skin',fore)
 for j in range(4):
  xx=s*.38+(j-1.5)*.021
  ell(side+'_finger'+str(j),[xx,.845+(abs(j-1.5))*.007,.064],[.012,.045,.018],'skin',fore,N=12,M=8)
 ell(side+'_thumb',[s*.335,.905,.075],[.024,.045,.023],'skinLight',fore,N=12,M=10)
# Recognizable stylized long face, expressive eyes and gapped smiling teeth.
ell('head',[0,1.87,0],[.17,.255,.157],'skin',N=40,M=28)
ell('jaw',[0,1.725,.055],[.12,.13,.105],'skin',N=32,M=20)
ell('chin',[0,1.655,.095],[.068,.045,.045],'skinLight')
for s in [-1,1]:
 ell('ear'+str(s),[s*.175,1.85,0],[.042,.068,.028],'skin')
 ell('inner_ear'+str(s),[s*.184,1.85,.023],[.022,.044,.008],'skinShadow',N=16,M=12)
 ell('cheek'+str(s),[s*.104,1.786,.108],[.052,.06,.033],'skinLight')
 ell('socket'+str(s),[s*.073,1.91,.131],[.060,.052,.028],'skinShadow')
 ell('eye'+str(s),[s*.073,1.91,.151],[.049,.042,.021],'eye')
 ell('iris'+str(s),[s*.071,1.91,.172],[.024,.028,.008],'iris',N=24,M=16)
 ell('pupil'+str(s),[s*.071,1.911,.179],[.012,.016,.004],'black',N=16,M=12)
 ell('glint'+str(s),[s*.071-.007,1.923,.183],[.007,.008,.002],'eye',N=12,M=8)
 tube('brow'+str(s),[[s*.029,1.972,.139],[s*.067,1.987,.141],[s*.115,1.976,.116]],[.012,.017,.011],'hair',N=12)
ell('nose_bridge',[0,1.875,.152],[.031,.065,.032],'skin')
ell('nose_tip',[0,1.829,.188],[.043,.031,.037],'skinLight')
for s in [-1,1]:ell('nostril'+str(s),[s*.028,1.815,.204],[.010,.006,.006],'skinShadow',N=12,M=8)
ell('smile',[0,1.746,.146],[.086,.045,.019],'mouth',N=32,M=20)
# Slight irregular spacing between upper front teeth, as in reference.
for j,(x,y,rx,ry) in enumerate([(-.057,1.763,.013,.012),(-.027,1.757,.014,.017),(.009,1.759,.015,.016),(.046,1.765,.013,.012)]):ell('tooth'+str(j),[x,y,.166],[rx,ry,.007],'eye',N=16,M=10)
tube('lower_lip',[[-.067,1.727,.153],[0,1.709,.157],[.067,1.727,.153]],[.007,.011,.007],'lip',N=12)
# Dark curls; cap shell with a front opening and backwards brim.
ell('hair',[0,2.025,-.018],[.167,.118,.149],'hair',N=32,M=18)
# Dome leaves an arched opening at front, revealing hair below strap.
N=48;M=12;v=[];f=[]
for j in range(M+1):
 a=(np.pi/2)*j/M
 for i in range(N):
  b=2*np.pi*i/N;v.append([.185*np.sin(a)*np.cos(b),2.035+.16*np.cos(a),-.012+.167*np.sin(a)*np.sin(b)])
for j in range(M):
 for i in range(N):
  b=2*np.pi*(i+.5)/N
  if j>6 and np.sin(b)>.65:continue
  a=j*N+i;c=j*N+(i+1)%N;f.extend([[a,c,a+N],[c,c+N,a+N]])
mesh('backwards_cap',v,f,'lime','head','headwear')
# Rear brim flattened oval; front adjustable snap strap.
ell('backwards_brim',[0,2.025,-.215],[.19,.017,.15],'lime','head','headwear',N=32,M=10)
tube('snap_strap',[[-.133,2.04,.122],[0,2.042,.155],[.133,2.04,.122]],[.018,.018,.018],'lime','head','headwear',N=12)
for i in range(7):ell('snap_hole'+str(i),[(i-3)*.027,2.045,.174-abs(i-3)*.004],[.004,.004,.002],'limeDark','head','headwear',N=8,M=6)
ell('cap_button',[0,2.20,-.012],[.015,.009,.015],'lime','head','headwear',N=12,M=8)
# Mesh-look perforations concentrated on side panels, batched by material in-game.
for j in range(4):
 a=.55+j*.19
 for i in range(16):
  b=2*np.pi*i/16
  if np.sin(b)>.65:continue
  pos=[.187*np.sin(a)*np.cos(b),2.035+.162*np.cos(a),-.012+.169*np.sin(a)*np.sin(b)]
  ell('cap_mesh_dot'+str(j)+'_'+str(i),pos,[.0035,.0035,.0035],'limeDark','head','headwear',N=6,M=4)
# Oversize blue sports sunglasses, white rim and temples. Opaque dark blue lenses.
for s in [-1,1]:
 center=[s*.083,1.918,.186]
 ell('blue_lens'+str(s),center,[.068,.052,.012],'lens','head','eyewear',N=28,M=16)
 ring('blue_frame'+str(s),[s*.083,1.918,.19],.074,.058,.012,'blue')
 ring('white_rim'+str(s),[s*.083,1.92,.198],.080,.064,.007,'white')
 tube('temple'+str(s),[[s*.158,1.933,.182],[s*.177,1.934,.06],[s*.17,1.91,-.035]],[.016,.014,.012],'white','head','eyewear',N=12)
 ell('lens_highlight'+str(s),[s*.083-.019,1.942,.20],[.018,.006,.003],'blue','head','eyewear',N=16,M=8)
tube('bridge',[[-.021,1.94,.195],[0,1.946,.202],[.021,1.94,.195]],[.012,.012,.012],'blue','head','eyewear',N=12)
# Small abstract supporter crest, fixed under shirt recolouring, without invented wordmarks.
ell('crest',[.10,1.376,.139],[.029,.039,.005],'green','torso',N=20,M=14)
ring('crest_border',[.10,1.376,.145],.022,.029,.003,'gold','torso','')
# Reference proportions and attachment positions for the existing procedural animation adapter.
g['extras']={'character':'lazo','status':'Original procedural concept prototype; approximate likeness; rigid articulation, not a skinned Meshy model.','scale':1.4,'joints':{
 'body':[None,[0,0,0],'bodyPivot'],'torso':['body',[0,.96,0],'torsoPivot'],'head':['torso',[0,1.57,0],'headPivot'],
 'leftArm':['torso',[-.24,1.48,0],'leftArmPivot'],'leftForearm':['leftArm',[-.35,1.15,.012],'leftForearmPivot'],
 'rightArm':['torso',[.24,1.48,0],'rightArmPivot'],'rightForearm':['rightArm',[.35,1.15,.012],'rightForearmPivot'],
 'leftLeg':['body',[-.135,.94,0],'leftLegPivot'],'leftShin':['leftLeg',[-.135,.52,.012],'leftShinPivot'],
 'rightLeg':['body',[.135,.94,0],'rightLegPivot'],'rightShin':['rightLeg',[.135,.52,.012],'rightShinPivot']}}
g['buffers']=[{'byteLength':len(blob)}];data=json.dumps(g,separators=(',',':')).encode();data+=b' '*((-len(data))%4);blob.extend(b'\0'*((-len(blob))%4));result=struct.pack('<4sII',b'glTF',2,28+len(data)+len(blob))+struct.pack('<I4s',len(data),b'JSON')+data+struct.pack('<I4s',len(blob),b'BIN\0')+blob
OUT.write_bytes(result)
print(json.dumps({'file':str(OUT),'size':len(result),'meshes':len(g['meshes'])}))
