Basic Structure:

STTandWS folder
`--speech-to-text-app folder
  `--src
    `--App.css
    `--App.js
  `--package.json
  `--Other folders
`--testServer folder
  `--package.json
  `--server.js

Navigating App.js:
- Contains comments for various code chunks that you can copy
Things you should copy (Until Lines 222):
- code for handling text chunks and inserting Punctuation and Capitilization (Lines 5 - 60)
- code for web text to speech API (Lines 62 - 85 for setup,functionality Lines 137-158)
- code for error handlong web socket, establishing web socket, and sending json to web socket (87-134)
- smooth auto scroll code (185 - 192)
- code for toggling record and stop (looks better than two seperate buttons, prevents people clicking record while its recording as well) (212 - 221)

Testing:
 1) Open speech-to-text-app directory and run 'npm start'
 2) Open testServer directory and run 'npm start'
 3) Open chrome and navigate to http://localhost:3000/
 4) Check bottom left corner, should say Connected with green light
 5) Click record and talk into mic, terminal window with testServer will show sent text chunks
 6) Click Stop button to stop recording any time
