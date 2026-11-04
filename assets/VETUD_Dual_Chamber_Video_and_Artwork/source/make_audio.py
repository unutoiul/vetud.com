from pathlib import Path
import numpy as np, wave
sr=48000; duration=40
out=np.zeros((sr*duration,2),dtype=np.float64)
def tone(start,length,freq,amp,pan=.5):
    n=int(length*sr);t=np.arange(n)/sr
    env=(1-np.exp(-t*6))*np.exp(-t/2.4)
    wave0=np.sin(2*np.pi*freq*t)+.19*np.sin(2*np.pi*freq*2*t)+.06*np.sin(2*np.pi*freq*3*t)
    sig=amp*wave0*env
    i=int(start*sr);n=min(n,len(out)-i)
    if n>0:out[i:i+n,0]+=sig[:n]*np.sqrt(1-pan);out[i:i+n,1]+=sig[:n]*np.sqrt(pan)
chords=[[48,55,59,62,67],[45,52,55,59,64],[41,48,52,57,60],[43,50,55,57,62]]
for bar in range(8):
    notes=chords[bar%4];start=bar*5
    for j,midi in enumerate(notes):
        tone(start+j*.055,5,440*2**((midi-69)/12),.025,.25+.1*j)
    for j in range(4):
        midi=notes[(j+bar)%5]+12
        tone(start+.625+j*1.25,3,440*2**((midi-69)/12),.021,.3+(j%3)*.2)
for event in [6,11.35,15.55,21.6,26,35]:
    tone(event,.7,880,.018,.5);tone(event+.04,.6,1320,.009,.6)
fade=np.minimum(1,np.arange(len(out))/(sr*1.5))*np.minimum(1,(len(out)-1-np.arange(len(out)))/(sr*2.2))
out*=fade[:,None]
out=np.tanh(out*1.7)*.75*2.5
p=Path(__file__).parent/"assets"/"ambient.wav"
with wave.open(str(p),"wb") as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32767).astype("<i2").tobytes())
print(str(p),len(out)/sr,"seconds",float(np.max(np.abs(out))))

