"""Rebuild the original procedural Islam concept; NumPy is needed only at build time.
Y-up, faces +Z, metres. Mesh extras describe rigid articulation and wardrobe slots.
"""
from pathlib import Path
import json, struct
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/games/ittihadawy/models/islam-prototype.glb'
blob=bytearray()
g={'asset':{'version':'2.0','generator':'ITTIHADAWY Islam concept v1'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':'Islam_Concept','children':[]}],'meshes':[],'materials':[],'accessors':[],'bufferViews':[]}
colors={'skin':(.45,.18,.075),'skinLight':(.54,.235,.105),'skinShadow':(.27,.082,.028),'mouth':(.105,.018,.01),'lip':(.30,.07,.026),'hair':(.045,.022,.01),'white':(.91,.93,.88),'green':(.012,.30,.073),'greenDark':(.008,.18,.035),'lime':(.75,.90,.012),'limeDark':(.27,.38,.007),'blue':(.008,.22,.66),'lens':(.012,.065,.16),'eye':(.96,.95,.90),'iris':(.19,.075,.018),'black':(.01,.014,.018),'sole':(.52,.55,.48),'gold':(.78,.56,.04),'denim':(.035,.17,.32),'stitch':(.19,.36,.50)}
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
 ell(side+'_upper_trouser',[x,.73,0],[.13,.28,.12],'denim',leg,'shorts')
 ell(side+'_knee',[x,.51,.012],[.113,.075,.108],'denim',leg,'shorts')
 ell(side+'_lower_trouser',[x,.33,0],[.11,.235,.105],'denim',shin,'shorts')
 tube(side+'_cuff',[[x,.15,0],[x,.19,0]],[.091,.102],'denim',shin,'shorts')
 ell(side+'_sole',[x,.045,.065],[.125,.045,.235],'white',shin,'shoes')
 ell(side+'_sneaker',[x,.095,.055],[.12,.075,.22],'white',shin,'shoes')
 for j in range(3):tube(side+'_lace'+str(j),[[x-.065,.158,.08+j*.032],[x+.065,.158,.08+j*.032]],[.006,.006],'white',shin,'',N=8)
ell('hips',[0,.94,0],[.24,.13,.13],'denim','body','shorts')
# Lathed tailored jersey with smooth shoulder and waist sections.
rings=[(.96,.24,.143),(1.02,.235,.14),(1.16,.21,.13),(1.31,.22,.135),(1.43,.26,.14),(1.49,.23,.12),(1.53,.105,.085)]
v=[];f=[];N=40
for y,rx,rz in rings:
 for a in np.linspace(0,2*np.pi,N,endpoint=False):v.append([rx*np.cos(a),y,rz*np.sin(a)])
for j in range(len(rings)-1):
 for i in range(N):
  a=j*N+i;b=j*N+(i+1)%N;f.extend([[a,b,a+N],[b,b+N,a+N]])
mesh('white_jersey',v,[list(reversed(face)) for face in f],'blue','torso','shirt')
ell('neck',[0,1.565,0],[.072,.135,.072],'skin','head')
# Collar ring lies horizontally around the neckline.
pts=[[.108*np.cos(a),1.526,.088*np.sin(a)] for a in np.linspace(0,2*np.pi,40)]
tube('green_collar',pts,[.016]*40,'blue','torso',N=10)
for s,side in [(-1,'left'),(1,'right')]:
 arm=side+'Arm';fore=side+'Forearm'
 ell(side+'_sleeve',[s*.265,1.425,0],[.115,.14,.115],'blue',arm,'shirt')
 tube(side+'_sleeve_trim',[[s*.29,1.335,0],[s*.30,1.31,0]],[.10,.098],'blue',arm,N=20)
 tube(side+'_upper_arm',[[s*.30,1.34,0],[s*.335,1.23,.005],[s*.35,1.15,.012]],[.073,.068,.061],'blue',arm,'shirt')
 ell(side+'_elbow',[s*.35,1.15,.012],[.062,.067,.061],'blue',fore,'shirt')
 tube(side+'_forearm',[[s*.35,1.15,.012],[s*.365,1.03,.03],[s*.38,.94,.05]],[.072,.070,.05],'blue',fore,'shirt')
 ell(side+'_hand',[s*.38,.90,.055],[.056,.079,.032],'skin',fore)
 for j in range(4):
  xx=s*.38+(j-1.5)*.021
  ell(side+'_finger'+str(j),[xx,.845+(abs(j-1.5))*.007,.064],[.012,.045,.018],'skin',fore,N=12,M=8)
 ell(side+'_thumb',[s*.335,.905,.075],[.024,.045,.023],'skinLight',fore,N=12,M=10)
# High zipped collar, blue sweatshirt cuffs and stitched denim seams.
for sign,side in [(-1,'left'),(1,'right')]:
 tube(side+'_collar',[[sign*.075,1.49,.07],[sign*.09,1.57,.02],[sign*.075,1.60,-.035]],[.027,.026,.024],'blue','torso',N=12)
 tube(side+'_cuff',[[sign*.378,.96,.047],[sign*.383,.93,.052]],[.053,.051],'blue',side+'Forearm','shirt',N=16)
 tube(side+'_jean_seam',[[sign*.24,.86,0],[sign*.247,.70,0],[sign*.236,.54,0]],[.003]*3,'stitch',side+'Leg',N=6)
 tube(side+'_lower_seam',[[sign*.233,.49,0],[sign*.23,.32,0],[sign*.22,.17,0]],[.003]*3,'stitch',side+'Shin',N=6)
tube('half_zip',[[0,1.51,.09],[0,1.43,.143],[0,1.32,.145]],[.007]*3,'black','torso',N=8)
ell('zip_pull',[0,1.32,.155],[.009,.018,.005],'sole','torso',N=12,M=8)
tube('waist_hem',[[0,.965,0],[0,.995,0]],[.24,.238],'blue','torso','shirt',N=40)
# White PALACE lettering built as lightweight strokes, no texture download.
letters={
 'P':[[(0,0),(0,1),(.65,1),(.75,.85),(.65,.55),(0,.55)]],
 'A':[[(0,0),(.35,1),(.75,0)],[(.16,.42),(.58,.42)]],
 'L':[[(0,1),(0,0),(.7,0)]],
 'C':[[(.7,.9),(.55,1),(.15,1),(0,.8),(0,.2),(.15,0),(.7,.05)]],
 'E':[[(.7,1),(0,1),(0,0),(.7,0)],[(0,.5),(.55,.5)]]}
for j,ch in enumerate('PALACE'):
 for k,path in enumerate(letters[ch]):
  pts=[[ -.18+j*.062+x*.05,1.18+y*.07,.148] for x,y in path]
  tube('chest_letter'+str(j)+'_'+str(k),pts,[.004]*len(pts),'white','torso',N=6)
# Wristwatch follows left forearm.
tube('watch_band',[[-.377,.962,.046],[-.383,.936,.051]],[.058,.058],'black','leftForearm',N=20)
ell('watch_face',[-.382,.95,.105],[.028,.027,.009],'black','leftForearm',N=16,M=10)
# Recognizable short dark beard, quiff haircut and expressive round eyes.
ell('head',[0,1.84,0],[.174,.232,.159],'skin',N=40,M=28)
ell('jaw',[0,1.69,.035],[.132,.115,.117],'skin',N=32,M=20)
ell('beard_jaw',[0,1.665,.052],[.136,.087,.113],'hair',N=32,M=20)
ell('lower_face',[0,1.706,.143],[.082,.058,.027],'skin')
for sign in [-1,1]:
 ell('ear'+str(sign),[sign*.176,1.82,-.006],[.036,.063,.027],'skin')
 ell('inner_ear'+str(sign),[sign*.186,1.82,.017],[.018,.04,.008],'skinShadow')
 ell('cheek'+str(sign),[sign*.108,1.77,.118],[.05,.062,.033],'skinLight')
 ell('beard_side'+str(sign),[sign*.129,1.713,.086],[.027,.076,.046],'hair')
 ell('eye_socket'+str(sign),[sign*.074,1.865,.14],[.055,.042,.024],'skinShadow')
 ell('eye'+str(sign),[sign*.074,1.866,.16],[.044,.031,.016],'eye')
 ell('iris'+str(sign),[sign*.073,1.866,.175],[.020,.025,.006],'iris')
 ell('pupil'+str(sign),[sign*.073,1.866,.180],[.010,.014,.003],'black')
 ell('glint'+str(sign),[sign*.073-.006,1.876,.183],[.005,.006,.002],'white',N=12,M=8)
 tube('brow'+str(sign),[[sign*.03,1.918,.145],[sign*.073,1.93,.14],[sign*.12,1.917,.12]],[.009,.012,.007],'hair',N=12)
 ell('temple_hair'+str(sign),[sign*.157,1.95,-.02],[.022,.085,.121],'hair')
ell('nose_bridge',[0,1.82,.16],[.028,.064,.029],'skin')
ell('nose_tip',[0,1.773,.196],[.037,.028,.033],'skinLight')
for sign in [-1,1]:ell('nostril'+str(sign),[sign*.025,1.76,.213],[.008,.005,.004],'skinShadow',N=12,M=8)
ell('lips',[0,1.699,.169],[.044,.017,.01],'lip')
tube('mouth_line',[[-.032,1.70,.178],[0,1.697,.181],[.032,1.70,.178]],[.003]*3,'mouth',N=8)
for sign in [-1,1]:ell('moustache'+str(sign),[sign*.025,1.724,.167],[.028,.015,.012],'hair')
# Permanent hairstyle remains visible when switching wardrobe headwear.
ell('hair_base',[0,2.004,-.023],[.166,.092,.148],'hair',N=32,M=18)
ell('quiff',[0,2.072,.032],[.151,.072,.109],'hair',N=32,M=18)
for i in range(9):
 x=(i-4)*.031
 tube('hair_sweep'+str(i),[[x,2.054,.125],[x-.007,2.108,.065],[x-.012,2.119,-.015]],[.012,.013,.007],'black',N=8)
# Reference proportions and attachment positions for the existing procedural animation adapter.
g['extras']={'character':'islam','status':'Original procedural concept prototype; approximate likeness; rigid articulation, not a skinned Meshy model.','scale':1.4,'joints':{
 'body':[None,[0,0,0],'bodyPivot'],'torso':['body',[0,.96,0],'torsoPivot'],'head':['torso',[0,1.57,0],'headPivot'],
 'leftArm':['torso',[-.24,1.48,0],'leftArmPivot'],'leftForearm':['leftArm',[-.35,1.15,.012],'leftForearmPivot'],
 'rightArm':['torso',[.24,1.48,0],'rightArmPivot'],'rightForearm':['rightArm',[.35,1.15,.012],'rightForearmPivot'],
 'leftLeg':['body',[-.135,.94,0],'leftLegPivot'],'leftShin':['leftLeg',[-.135,.52,.012],'leftShinPivot'],
 'rightLeg':['body',[.135,.94,0],'rightLegPivot'],'rightShin':['rightLeg',[.135,.52,.012],'rightShinPivot']}}
g['buffers']=[{'byteLength':len(blob)}];data=json.dumps(g,separators=(',',':')).encode();data+=b' '*((-len(data))%4);blob.extend(b'\0'*((-len(blob))%4));result=struct.pack('<4sII',b'glTF',2,28+len(data)+len(blob))+struct.pack('<I4s',len(data),b'JSON')+data+struct.pack('<I4s',len(blob),b'BIN\0')+blob
OUT.write_bytes(result)
print(json.dumps({'file':str(OUT),'size':len(result),'meshes':len(g['meshes'])}))
