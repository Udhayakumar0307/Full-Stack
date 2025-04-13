const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const MONGO_URI = "mongodb+srv://abcd:abcd@cluster0.rpvjc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

const JWT_SECRET = "1d4d551e54665bcf4fe9d728910ae65e690af9f6fd37c689c1795642eca41c7745ee4db2a42cad262855388ee95786ed169fb28e15bd2f898edaad4fd58e85dff10d01b69ec15cb5eca962b64d149b7e37bf21dcca5c9e9e1dc6dddd5e8fee4323a63cea0c5f0d13cffe5607376d2b1726e29e229065dafa57ce89eb935bbf6880f8272c7a1d35ede5322a79651e4378e59aac4cc95f27737878170bdc60c9e15efb6b35ba9e28adbae46b39e3528ab3302e4ab4d96e040931e49ab7fdb33447f047d0e00b2864ec4c96eabab9f09f80f1fd3c43d3795c123903d6c3e8aa8b60ae64cde0911557bc86c08816dd27d57f046f6a9ee108f7f0191171c5de2091ef";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  interest: { type: String, required: true },
  password: { type: String, required: true },
  userid: { type: Number, required: true, unique: true },
  status: { type: String, default: "Active" },
  member_since: { type: String, default: "" }
});

const User = mongoose.model('User', userSchema);

const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true },
});

const Counter = mongoose.model('Counter', counterSchema);

const initializeCounter = async () => {
  try {
    const existingCounter = await Counter.findOne({ key: 'userid' });
    if (!existingCounter) {
      await Counter.create({ key: 'userid', value: 1000 });
      console.log('Counter initialized to 1000');
    }
  } catch (err) {
    console.error('Error initializing counter:', err);
  }
};

initializeCounter();

const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ error: 'Access Denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid Token' });
    req.user = user;
    next();
  });
};

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

app.get("/", (req, res) => {
  const authToken = req.cookies.authToken;
  const user = authToken ? { loggedIn: true } : null;
  res.render("index", { user });
});

app.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/');
});

app.get('/users', authenticateToken, async (req, res) => {
  const users = await User.find();
  res.render('users', { users });
});

app.post('/submit-form', async (req, res) => {
  const { name, email, phone, age, interest, password } = req.body;
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).send('Invalid phone number format.');
  }
  if (age <= 0) {
    return res.status(400).send('Age must be greater than 0.');
  }

  const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
  if (existingUser) {
    return res.status(400).send('User with the same phone or email already exists.');
  }
  let counter = await Counter.findOneAndUpdate(
    { key: 'userid' },
    { $inc: { value: 1 } },
    { new: true }
  );

  if (!counter) {
    counter = await Counter.create({ key: 'userid', value: 1001 });
  }

  const newUserId = counter.value;
  const hashedPassword = await bcrypt.hash(password, 10);
  const formattedDate = formatDate(new Date());

  const newUser = new User({
    name,
    email,
    phone,
    age,
    interest,
    password: hashedPassword,
    userid: newUserId,
    status: "Active",
    member_since: formattedDate
  });
  await newUser.save();

  const user = await User.findOne({ email });
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.cookie('authToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 3600000 });
  res.redirect('/dashboard');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.redirect('/#signup');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.cookie('authToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 3600000 });
  res.redirect('/dashboard');
});

app.post('/api/users/update/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, age, interest } = req.body;

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.name = name;
  user.email = email;
  user.phone = phone;
  user.age = age;
  user.interest = interest;

  await user.save();
  res.redirect('/users');
});

app.get('/api/users', authenticateToken, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get('/dashboard', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }

  try {
    const user = await User.findById(req.user.id);
    res.render("dashboard", { user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = await User.findOneAndDelete({ userid: id });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

app.get('/edituser/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = await User.findOne({ userid: id });
  if (!user) {
    return res.status(404).send('User not found');
  }

  res.render('edituser', { user });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));