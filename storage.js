// Simple persistent storage for users and cheatsheets
const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'users.json');
const CHEATSHEETS_PATH = path.join(__dirname, 'cheatsheets.json');

function loadUsers() {
    if (!fs.existsSync(USERS_PATH)) return [];
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
}

function saveUsers(users) {
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

function loadCheatsheets() {
    if (!fs.existsSync(CHEATSHEETS_PATH)) return [];
    return JSON.parse(fs.readFileSync(CHEATSHEETS_PATH, 'utf8'));
}

function saveCheatsheets(cheatsheets) {
    fs.writeFileSync(CHEATSHEETS_PATH, JSON.stringify(cheatsheets, null, 2));
}

module.exports = {
    loadUsers,
    saveUsers,
    loadCheatsheets,
    saveCheatsheets
};
