import sys, os, ntpath, math

if sys.argv[1] and os.path.exists(sys.argv[1]):

    f = open(sys.argv[1],'r')
    text = f.read()
    f.close()

    arr = text.split("\n")
    text = "["
    for t in arr:
        text += '"'+t+'", '
    text = text[:-2]
    text = "".join(text.split())
    text += "]"
    text = text.strip()

    newFile = sys.argv[1][:-4]+".json"
    f = open(newFile,'w')

    f.seek(0)
    f.write(text)
    
    f.truncate()
    f.close()