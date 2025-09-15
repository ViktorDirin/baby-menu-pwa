#!/bin/bash
echo "Creating Baby Menu archive..."
zip -r BabyMenu.zip index.html styles.css app.js manifest.json README.md
echo "Archive created: BabyMenu.zip"
echo ""
echo "To use:"
echo "1. Extract archive to any folder"
echo "2. Open index.html in browser"
echo "3. Start using the app!"
