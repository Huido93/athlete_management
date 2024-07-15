require('dotenv').config()
const express = require('express')
const { MongoClient, ObjectId } = require('mongodb')
const bcrypt = require('bcrypt') 
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const path = require('path');
const cors = require('cors');
const moment = require('moment');

const app = express();

let db; 

const url = process.env.DATABASE_URL 
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('athlete_management')
}).catch((err)=>{
  console.log(err) 
})

// Serve static files only in development environment
if (process.env.NODE_ENV === 'development') {
  app.use(express.static(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'client/build')));
}

// Example API endpoint
app.get('/', (req, res) => {
  res.send({ message: 'Hello from the server!' });
});

app.set('view engine', 'ejs') 

// 유저가 보낸 array/object 데이터를 출력해보기 위해 필요
// 요청.body를 통해 유저가 서버로 보낸 정보 쉽게 꺼내보기 위한 설정 코드
app.use(express.json())
app.use(express.urlencoded({extended:true})) 

// 다른 도메인주소끼리 ajax 요청 주고받을 때 필요
app.use(cors(
  {
   origin:'https://huido93.github.io/athlete_management',
   credentials: true 
  }
));

app.use(session({ 
  secret : process.env.SESSION_SECRET,
  resave : false,
  saveUninitialized : false,
  // 세션 한시간 유지
  cookie : { maxAge : 60 * 60 * 1000 }
  }))

app.use(passport.initialize())
app.use(passport.session());

//  아이디/비번이 DB와 일치하는지 검증하는 로직, API 안에서 passport.authenticate('local') 이런 코드 작성하면 자동으로 실행
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('user').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: '아이디 DB에 없음' })
  }
  if (await bcrypt.compare(입력한비번, result.password)) {
    return cb(null, result)
  } else {
    return cb(null, false, { message: '비번불일치' });
  }
}))

// 세션 자동 생성해주는 코드
passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username })
  })
})

// 서버가 쿠키를 확인하고 유저가 로그인 잘되어있는지 여부를 판단하는 코드 / API에서 req.user을 쓰면 로그인된 유저 정보 출력 가능
passport.deserializeUser(async (user, done) => {
  let result = await db.collection('user').findOne({_id : new ObjectId(user.id) })
  delete result.password
  process.nextTick(() => {
    return done(null, result)
  })
})

// Middleware to make user available in all templates
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/build/index.html'));
// });


app.post('/login', async (요청, 응답, next) => {
  passport.authenticate('local', (error, user, info) => {
      if (error) return 응답.status(500).json(error)
      if (!user) return 응답.status(401).json(info.message)
      요청.logIn(user, (err) => {
        if (err) return next(err)
        응답.redirect('/')
      })
  })(요청, 응답, next)
}) 

app.get('/loggedin', async (req, res) => {
  res.send(req.user)
})

app.post('/register', async (req, res) => {
  
  const { username, name, email, password, passwordCheck, role } = req.body;

  // Check if all fields are filled
  if (!username || !name || !email || !password || !passwordCheck || !role) {
      return res.status(400).send('All fields are required');
  }
  // Check if passwords match
  if (password !== passwordCheck) {
      return res.status(400).send('Passwords do not match');
  }
  let hashedPassword = await bcrypt.hash(password, 10)

  const newUser = { username, name, email, password: hashedPassword, role, date: new Date() };
  try {

      // Check if the username is already taken
      const existingUser = await db.collection('user').findOne({ username });
      if (existingUser) {
          return res.status(400).send('Username is already taken');
      }

      await db.collection('user').insertOne(newUser);

      res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
      console.error(error);
      res.status(500).send('Error registering user.');
  }
});

app.get('/protected', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  } 
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to log out.');
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.send('Logged out successfully.');
  });
});

app.post('/newSession', isAuthenticated,  async(req, res) => {
  let sessionName = req.body.sessionName
  try {
    const result = await db.collection('workout_session').insertOne({
      name: req.body.sessionName,
      userId: req.user._id,
      date: new Date()
    });
    console.log('Session created with ID:', result.insertedId);
    res.status(201).json({ message: 'Successfully made new workout session' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating session.');
  }
});

app.get('/sessions', isAuthenticated, async (req, res) => {
  try {
    const sessions = await db.collection('workout_session').find({ userId: req.user._id }).toArray();
    // Format the session dates
    sessions.forEach(session => {
      session.formattedDate = moment(session.date).format('ddd MMM DD YYYY HH:mm');
    });
    res.send(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching exercise sessions.');
  }
});

app.get('/thisSession', isAuthenticated, async (req, res) => {
  try {
    const sessionId = req.query.sessionId; // Use req.query for GET parameters
    const thisSession = await db.collection('workout_session').findOne({ sessionId: sessionId });

    if (thisSession) {
      res.send(thisSession);
    } else {
      res.status(404).send({ error: 'Session not found' });
    }
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' });
  }
});


// workout logs
app.get('/workoutlogs/:id', isAuthenticated, async(req, res) => {
  var sessionId = req.params.id
  var session = await db.collection('workout_session').findOne({_id: new ObjectId(sessionId)})
  var workouts = await db.collection('workout_records').find({session: new ObjectId(sessionId)}).toArray()
  if(session){
    res.send({ session: session, workouts: workouts });
  }else{
    res.send('error')
  } 
});

app.post('/workoutlogs/:id', isAuthenticated, async (req, res) => {
  const { exercise, weight, reps } = req.body;

  // Basic input validation
  if (!exercise || !weight || !reps) {
    return res.status(400).send('Missing required fields.');
  }

  const newRecord = {
    session: new ObjectId(req.params.id),
    athlete: req.user._id,
    exercise: exercise.trim(),
    weight: parseInt(weight),
    reps: parseInt(reps),
    createdAt: new Date() // Optional: Add a timestamp
  };

  try {
    const result = await db.collection('workout_records').insertOne(newRecord);
    console.log(result)
    if (result.acknowledged == true) {
      res.json(newRecord);  // Return the newly created record as JSON
    } else {
      res.status(500).send('Failed to log exercise.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging exercise.');
  }
});

app.put('/editworkout/:workoutId', isAuthenticated, async (req, res) => {
  const { exercise, weight, reps } = req.body;

  // Basic input validation
  if (!exercise || !weight || !reps) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  // More robust input validation
  if (typeof exercise !== 'string' || exercise.trim() === '') {
    return res.status(400).json({ error: 'Invalid exercise.' });
  }
  if (!Number.isInteger(parseInt(weight)) || weight < 0) {
    return res.status(400).json({ error: 'Invalid weight.' });
  }
  if (!Number.isInteger(parseInt(reps)) || reps < 0) {
    return res.status(400).json({ error: 'Invalid reps.' });
  }
 
  try {
    const result = await db.collection('workout_records').updateOne(
      { _id: new ObjectId(req.params.workoutId) },
      {
        $set: {
          exercise: exercise.trim(),
          weight: parseInt(weight),
          reps: parseInt(reps)
        }
      }
    );

    if (result.matchedCount > 0) {
      res.json({ message: 'Exercise updated successfully.' });
    } else {
      res.status(500).json({ error: 'Failed to update exercise.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating exercise.' });
  }
});

app.delete('/deleteworkout/:workoutId', isAuthenticated, async (req, res) => {
  try {
    const result = await db.collection('workout_records').deleteOne({ _id: new ObjectId(req.params.workoutId) });

    if (result.deletedCount > 0) {
      res.json({ message: 'Exercise deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Exercise not found.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting exercise.' });
  }
});

app.get('sessionWorkoutRecords', isAuthenticated, async (req, res) => {
  try {
    const records = await db.collection('workout_records').find({session: session}).toArray()
    res.send({records:records})
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'Error fetching workout records'})
  }
})

app.get('/programs', isAuthenticated, async(req, res) => {
  try {
    const programs = await db.collection('workout_programs').find({athlete_id: req.user._id}).toArray()
    console.log(programs) 
    res.send({programs:programs})
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching programs'})    
  }
})

app.get('/profileinfo/:id', async(req,res) => {
  try {
    const profile = await db.collection('user').findOne(
      {_id:new ObjectId(req.params.id)},
      { projection: { password: 0 } } // Exclude the password field
      )
    console.log('sent info successfully')
    res.send(profile)
  } catch (err) {
    console.error(err)
    res.status(500).json({error: 'Error fetching profile info'})
  }
})

app.get('/searchcoach/:email', async(req, res) => {
  try {
    console.log(req.params.email)
    let coach = await db.collection('user').findOne(
      {email: req.params.email},
      {projection: {password: 0}}
  )
    console.log(coach)
    if (coach == null || coach.role !== 'coach') {
      res.send(null);
    } else {
      res.send(coach);
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({error: 'Error fetching coach info'})
  }
})

app.post('/checkrole', async(req, res) => {
  const user_ids  = req.body.idArray;
  console.log(user_ids)
  if (!user_ids || user_ids.length === 0) {
    return res.status(400).send({ error: 'Invalid input' });
  }
  try {
    const users = await db.collection('user').find({ _id: { $in: user_ids.map(id => new ObjectId(id)) } }).toArray();
    const roles = {};
    users.forEach(user => roles[user._id] = user.role);
    res.send(roles);
  } catch (error) {
    console.error('Error checking role:', error);
    throw error;
  } 
}) 

app.post('/makeconnection', async(req, res) => {
  const roles = req.body.roles
  try {
    await db.collection('connections').insertOne({
      athlete: new ObjectId(roles.athlete),
      coach: new ObjectId(roles.coach),
      req: req.user._id,
      req_date: new Date(),
      res_date: null,
      status: 'pending'
    })
  } catch (error) {
    console.error('Error inserting connection document', error);
  }
  
})

app.get('/fetchconnection/:userId', async (req, res) => {
  const userId = new ObjectId(req.params.userId);

  try {
    const connection = await db.collection('connections').findOne({
      $or: [
        { athlete: userId },
        { coach: userId }
      ]
    });

    if (connection) {
      res.status(200).send(connection);
    } else {
      res.status(404).send({ message: 'Connection not found' });
    }
  } catch (error) {
    console.error('Error fetching connection:', error);
    res.status(500).send({ error: 'Error fetching connection' });
  }
});

// 가장 하단에 위치시켜두어야 함: 라우팅을 모두 리액트가 관리하도록 설정
app.get('*', function (요청, 응답) {
  응답.sendFile(path.join(__dirname, '/react-project/build/index.html'));
});