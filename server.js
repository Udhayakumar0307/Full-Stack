const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let users = {};
const USERS_FILE = 'users.json';

if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/submit', (req, res) => {
    const { name, email, phone, age, interest, course } = req.body;

    console.log('Received form data:', req.body);

    let userId;
    if (users[email]) {
        userId = users[email]; 
    } else {
        userId = Math.floor(1000 + Math.random() * 9000); 
        users[email] = userId; 
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }

    res.render('form', {
        userId,
        name,
        email,
        phone,
        age,
        interest,
        course,
        memberSince: new Date().toLocaleDateString()
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
