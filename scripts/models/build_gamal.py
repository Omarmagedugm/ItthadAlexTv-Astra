"""Rebuild the original procedural Gamal concept; NumPy is needed only at build time.
Y-up, faces +Z, metres. Mesh extras describe rigid articulation and wardrobe slots.
"""
from pathlib import Path
import json, struct
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/games/ittihadawy/models/gamal-prototype.glb'
blob=bytearray()
g={'asset':{'version':'2.0','generator':'ITTIHADAWY Gamal concept v1'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':'Gamal_Concept','children':[]}],'meshes':[],'materials':[],'accessors':[],'bufferViews':[]}
colors={'skin':(.45,.18,.075),'skinLight':(.54,.235,.105),'skinShadow':(.27,.082,.028),'mouth':(.105,.018,.01),'lip':(.30,.07,.026),'hair':(.045,.022,.01),'white':(.91,.93,.88),'green':(.012,.30,.073),'greenDark':(.008,.18,.035),'lime':(.75,.90,.012),'limeDark':(.27,.38,.007),'blue':(.008,.22,.66),'lens':(.012,.065,.16),'eye':(.96,.95,.90),'iris':(.19,.075,.018),'black':(.01,.014,.018),'sole':(.52,.55,.48),'gold':(.78,.56,.04),'beard':(.18,.17,.15),'grey':(.38,.36,.32),'ember':(.9,.045,.005)}
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
 ell(side+'_upper_trouser',[x,.73,0],[.13,.28,.12],'black',leg,'shorts')
 ell(side+'_knee',[x,.51,.012],[.113,.075,.108],'black',leg,'shorts')
 ell(side+'_lower_trouser',[x,.33,0],[.11,.235,.105],'black',shin,'shorts')
 tube(side+'_cuff',[[x,.15,0],[x,.19,0]],[.091,.102],'black',shin,'shorts')
 ell(side+'_sole',[x,.045,.065],[.125,.045,.235],'white',shin,'shoes')
 ell(side+'_sneaker',[x,.095,.055],[.12,.075,.22],'black',shin,'shoes')
 for j in range(3):tube(side+'_lace'+str(j),[[x-.065,.158,.08+j*.032],[x+.065,.158,.08+j*.032]],[.006,.006],'white',shin,'',N=8)
ell('hips',[0,.94,0],[.24,.13,.13],'black','body','shorts')
# Lathed tailored jersey with smooth shoulder and waist sections.
rings=[(.96,.24,.143),(1.02,.235,.14),(1.16,.21,.13),(1.31,.22,.135),(1.43,.26,.14),(1.49,.23,.12),(1.53,.105,.085)]
v=[];f=[];N=40
for y,rx,rz in rings:
 for a in np.linspace(0,2*np.pi,N,endpoint=False):v.append([rx*np.cos(a),y,rz*np.sin(a)])
for j in range(len(rings)-1):
 for i in range(N):
  a=j*N+i;b=j*N+(i+1)%N;f.extend([[a,b,a+N],[b,b+N,a+N]])
mesh('white_jersey',v,[list(reversed(face)) for face in f],'green','torso','shirt')
ell('neck',[0,1.565,0],[.072,.135,.072],'skin','head')
# Collar ring lies horizontally around the neckline.
pts=[[.108*np.cos(a),1.526,.088*np.sin(a)] for a in np.linspace(0,2*np.pi,40)]
tube('green_collar',pts,[.016]*40,'green','torso',N=10)
for s,side in [(-1,'left'),(1,'right')]:
 arm=side+'Arm';fore=side+'Forearm'
 ell(side+'_sleeve',[s*.265,1.425,0],[.115,.14,.115],'green',arm,'shirt')
 tube(side+'_sleeve_trim',[[s*.29,1.335,0],[s*.30,1.31,0]],[.10,.098],'green',arm,N=20)
 tube(side+'_upper_arm',[[s*.30,1.34,0],[s*.335,1.23,.005],[s*.35,1.15,.012]],[.073,.068,.061],'green',arm,'shirt')
 ell(side+'_elbow',[s*.35,1.15,.012],[.062,.067,.061],'green',fore,'shirt')
 tube(side+'_forearm',[[s*.35,1.15,.012],[s*.365,1.03,.03],[s*.38,.94,.05]],[.072,.070,.05],'green',fore,'shirt')
 ell(side+'_hand',[s*.38,.90,.055],[.056,.079,.032],'skin',fore)
 for j in range(4):
  xx=s*.38+(j-1.5)*.021
  ell(side+'_finger'+str(j),[xx,.845+(abs(j-1.5))*.007,.064],[.012,.045,.018],'skin',fore,N=12,M=8)
 ell(side+'_thumb',[s*.335,.905,.075],[.024,.045,.023],'skinLight',fore,N=12,M=10)
# Long black open waistcoat fitted around the green shirt, no copied logos.
for side in [-1,1]:
 v=[];f=[];N=24;M=14
 for j in range(M+1):
  y=.91+j*.58/M
  rx=np.interp(y,[.91,1.02,1.16,1.31,1.43,1.49],[.25,.247,.224,.234,.274,.245])
  rz=np.interp(y,[.91,1.02,1.16,1.31,1.43,1.49],[.157,.154,.144,.149,.154,.134])
  for i in range(N+1):
   a=.49+(np.pi-.49)*i/N;v.append([side*rx*np.sin(a),y,rz*np.cos(a)])
 for j in range(M):
  for i in range(N):
   k=j*(N+1)+i;f.extend([[k,k+1,k+N+1],[k+1,k+N+2,k+N+1]])
 mesh('black_waistcoat'+str(side),v,f,'black','torso')
# White wrist cuffs and green/white supporter scarf follow torso, not head.
for side,sign in [('left',-1),('right',1)]:
 tube(side+'_white_cuff',[[sign*.378,.958,.047],[sign*.383,.926,.052]],[.055,.053],'white',side+'Forearm')
pts=[[.112*np.cos(a),1.53,.098*np.sin(a)] for a in np.linspace(0,2*np.pi,49)]
tube('scarf_neck',pts,[.037]*49,'white','torso',N=12)
for i in range(12):
 a=i*np.pi/6;segment=[[.112*np.cos(t),1.53,.098*np.sin(t)] for t in np.linspace(a,a+.25,5)]
 tube('scarf_neck_stripe'+str(i),segment,[.039]*5,'greenDark','torso',N=10)
for sign,length in [(-1,.36),(1,.29)]:
 for j in range(8):
  y=1.49-j*length/8
  tube('scarf_tail'+str(sign)+'_'+str(j),[[sign*.064,y,.157],[sign*.069,y-length/8,.17]],[.042,.041],'white' if j%2 else 'greenDark','torso',N=12)
 for k in range(5):tube('scarf_fringe'+str(sign)+'_'+str(k),[[sign*.069+(k-2)*.013,1.49-length,.17],[sign*.069+(k-2)*.013,1.46-length,.17]],[.002,.002],'white','torso',N=6)
# Angular mature face: narrower cheeks, prominent nose, grey beard and dark brows.
ell('head',[0,1.84,-.005],[.167,.238,.15],'skin',N=40,M=28)
ell('jaw',[0,1.70,.025],[.126,.12,.117],'skin',N=32,M=20)
ell('beard_jaw',[0,1.68,.055],[.131,.105,.108],'beard',N=32,M=20)
ell('chin_beard',[0,1.61,.108],[.075,.041,.05],'grey')
for sign in [-1,1]:
 ell('ear'+str(sign),[sign*.171,1.82,-.008],[.037,.065,.028],'skin')
 ell('inner_ear'+str(sign),[sign*.181,1.82,.016],[.019,.042,.008],'skinShadow')
 ell('cheek'+str(sign),[sign*.105,1.76,.104],[.047,.063,.035],'skinLight')
 ell('beard_side'+str(sign),[sign*.125,1.725,.075],[.034,.098,.051],'beard')
 ell('eye_socket'+str(sign),[sign*.073,1.866,.128],[.057,.037,.026],'skinShadow')
 ell('eye'+str(sign),[sign*.073,1.864,.148],[.042,.024,.017],'eye')
 ell('iris'+str(sign),[sign*.070,1.865,.164],[.018,.022,.006],'iris')
 ell('pupil'+str(sign),[sign*.070,1.865,.169],[.009,.012,.003],'black')
 ell('eye_glint'+str(sign),[sign*.070-.005,1.873,.172],[.004,.005,.002],'white',N=12,M=8)
 tube('brow'+str(sign),[[sign*.027,1.904,.143],[sign*.063,1.917,.14],[sign*.118,1.911,.115]],[.013,.018,.011],'hair',N=12)
 tube('cheek_crease'+str(sign),[[sign*.058,1.77,.156],[sign*.085,1.735,.151],[sign*.076,1.706,.142]],[.002,.003,.002],'skinShadow',N=8)
 # Individual short grey beard strokes, merged by material at runtime.
 for j in range(12):
  y=1.65+(j%4)*.027;x=sign*(.035+(j//4)*.035);z=.157-abs(x)*.22
  tube('beard_stroke'+str(sign)+'_'+str(j),[[x,y,z],[x+sign*.003,y-.012,z+.002]],[.002,.001],'grey',N=5)
ell('long_nose_bridge',[0,1.81,.15],[.029,.074,.036],'skin')
ell('nose_tip',[0,1.76,.198],[.039,.033,.042],'skinLight')
for sign in [-1,1]:ell('nostril'+str(sign),[sign*.027,1.746,.21],[.009,.005,.005],'skinShadow',N=12,M=8)
ell('mouth',[0,1.697,.165],[.051,.012,.009],'mouth')
for sign in [-1,1]:ell('moustache'+str(sign),[sign*.029,1.716,.167],[.035,.018,.016],'grey')
# Green cloth headwrap with wrapped bands, top knot and tail at the back.
ell('turban_crown',[0,2.01,-.016],[.178,.117,.16],'greenDark','head','headwear',N=36,M=22)
for j in range(4):
 pts=[[.186*np.cos(a),1.953+j*.021+.007*np.sin(a),-.012+.169*np.sin(a)] for a in np.linspace(0,2*np.pi,49)]
 tube('turban_wrap'+str(j),pts,[.018]*49,'green' if j%2 else 'greenDark','head','headwear',N=10)
ell('turban_knot',[0,2.13,-.015],[.031,.028,.027],'greenDark','head','headwear')
tube('headwrap_tail',[[.123,1.97,-.12],[.16,1.85,-.15],[.165,1.70,-.14]],[.04,.037,.025],'greenDark','head','headwear',N=12)
# Small green whistle at lips.
tube('whistle',[[0,1.694,.174],[0,1.675,.232]],[.015,.021],'lime','head',N=12)
# Hand-held censer: chains and coal bowl, all rigidly following left forearm.
for sign in [-1,1]:
 pts=[[-.38+sign*.015,.86,.085],[-.40+sign*.045,.69,.10],[-.40+sign*.075,.55,.10]]
 tube('censer_chain'+str(sign),pts,[.004]*3,'black','leftForearm',N=6)
ell('censer_bowl',[-.40,.50,.10],[.112,.065,.112],'black','leftForearm',N=28,M=18)
pts=[[-.40+.113*np.cos(a),.54,.10+.113*np.sin(a)] for a in np.linspace(0,2*np.pi,33)]
tube('censer_rim',pts,[.008]*33,'grey','leftForearm',N=8)
for i in range(7):
 a=i*2*np.pi/7
 ell('hot_coal'+str(i),[-.40+.066*np.cos(a),.548,.10+.066*np.sin(a)],[.018,.009,.014],'ember','leftForearm',N=10,M=8)
# Reference proportions and attachment positions for the existing procedural animation adapter.
g['extras']={'character':'gamal','status':'Original procedural concept prototype; approximate likeness; rigid articulation, not a skinned Meshy model.','scale':1.4,'joints':{
 'body':[None,[0,0,0],'bodyPivot'],'torso':['body',[0,.96,0],'torsoPivot'],'head':['torso',[0,1.57,0],'headPivot'],
 'leftArm':['torso',[-.24,1.48,0],'leftArmPivot'],'leftForearm':['leftArm',[-.35,1.15,.012],'leftForearmPivot'],
 'rightArm':['torso',[.24,1.48,0],'rightArmPivot'],'rightForearm':['rightArm',[.35,1.15,.012],'rightForearmPivot'],
 'leftLeg':['body',[-.135,.94,0],'leftLegPivot'],'leftShin':['leftLeg',[-.135,.52,.012],'leftShinPivot'],
 'rightLeg':['body',[.135,.94,0],'rightLegPivot'],'rightShin':['rightLeg',[.135,.52,.012],'rightShinPivot']}}
g['buffers']=[{'byteLength':len(blob)}];data=json.dumps(g,separators=(',',':')).encode();data+=b' '*((-len(data))%4);blob.extend(b'\0'*((-len(blob))%4));result=struct.pack('<4sII',b'glTF',2,28+len(data)+len(blob))+struct.pack('<I4s',len(data),b'JSON')+data+struct.pack('<I4s',len(blob),b'BIN\0')+blob
OUT.write_bytes(result)
print(json.dumps({'file':str(OUT),'size':len(result),'meshes':len(g['meshes'])}))
