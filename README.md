# Codify
Whiteboard -> IDE

## Inspiration
Many a night spent with the whiteboard, coding furiously away at our homeworks.

## What it does
Enables someone to take a picture of handwritten or printed text converts it directly to code on your favorite IDE on your computer.

## How we built it
On the front end, we built an app using Ionic/Cordova so the user could take a picture of their code. Behind the scenes, using JavaScript, our software harnesses the power of the Google Cloud Vision API to perform intelligent character recognition (ICR) of handwritten words. Following that, we applied our own formatting algorithms to prettify the code. Finally, our server sends the formatted code to the desired computer, which opens it with the appropriate file extension in your favorite IDE.

## Challenges we ran into
Correctly formatting with tabs and spaces the output of the Vision API. Also, general lack of JS experience.

## Accomplishments that we're proud of
A beautiful spacing algorithm that recursively categorizes lines into indentation levels.
Getting the app to talk to the main server to talk to the target computer.

## What we learned
How to integrate and use the Google Cloud Vision API.
How to build and communicate across servers in JavaScript.
How to interact with native functions of a phone.


## What's next for Codify
Increasing accuracy by using the Levenshtein distance between words.
