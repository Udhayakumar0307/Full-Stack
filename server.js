const express = require('express');
const app = express();
const port = 3001;
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/submit', (req, res) => {
    const { name, email, age, phone } = req.body;
    console.log('Form data received:', req.body);
    if (!name || !email || !age || !phone) {
        return res.send('All fields are required!');
    }
    if (age < 18) {
        return res.send('Age must be 18 or older.');
    }
    if (phone.length !== 10) {
        return res.send('Phone number must contain exactly 10 digits.');
    }
    res.render('result', { name, email });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
