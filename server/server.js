require('dotenv').config()
const express = require('express')
const { MongoClient, ObjectId } = require('mongodb')
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt') 
// const session = require('express-session')
// const passport = require('passport')
// const LocalStrategy = require('passport-local')
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const moment = require('moment-timezone');


const app = express();
// app.set('trust proxy', 1)

let db; 

const connectToDb = async () => {
  const mongoUrl = process.env.DATABASE_URL
  try {
    const client = await new MongoClient(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).connect();
    console.log('DB 연결성공');
    db = client.db('athlete_management');
  } catch (err) {
    console.log('Error connecting to DB:', err);
  }
};


const secretKey = process.env.JWT_SECRET

// Example API endpoint
app.get('/', (req, res) => {
  res.send({ message: 'Hello from the server!' });
});

app.set('view engine', 'ejs') 

// 유저가 보낸 array/object 데이터를 출력해보기 위해 필요
// 요청.body를 통해 유저가 서버로 보낸 정보 쉽게 꺼내보기 위한 설정 코드
app.use(express.json())
app.use(express.urlencoded({extended:true})) 

app.use(bodyParser.json());

const isProduction = process.env.NODE_ENV === 'production';
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`isProduction: ${isProduction}`);

// Define allowed origins
const allowedOrigins = ['https://huido93.github.io', 'http://localhost:3000'];

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// app.use(session({ 
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: false,
//   proxy: true, // Trust the reverse proxy when secure cookies are used
//   store: MongoStore.create({
//     mongoUrl: mongoUrl,
//     collectionName: 'sessions'
//   }),
//   cookie: { 
//     maxAge: 60 * 60 * 1000, // 1 hour
//     httpOnly: true,
//     secure: isProduction, // Use secure cookies in production
//     sameSite: isProduction ? 'None' : 'Lax', // Required for cross-site cookies
//     domain: '9athlete.com' // Set the domain
//   }
//   }))

// app.use(passport.initialize())
// app.use(passport.session());

// //  아이디/비번이 DB와 일치하는지 검증하는 로직, API 안에서 passport.authenticate('local') 이런 코드 작성하면 자동으로 실행
// passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
//   let result = await db.collection('user').findOne({ username : 입력한아이디})
//   if (!result) {
//     return cb(null, false, { message: '아이디 DB에 없음' })
//   }
//   if (await bcrypt.compare(입력한비번, result.password)) {
//     return cb(null, result)
//   } else {
//     return cb(null, false, { message: '비번불일치' });
//   }
// }))

// // 세션 자동 생성해주는 코드
// passport.serializeUser((user, done) => {
//   process.nextTick(() => {
//     done(null, { id: user._id, username: user.username })
//   })
// })

// // 서버가 쿠키를 확인하고 유저가 로그인 잘되어있는지 여부를 판단하는 코드 / API에서 req.user을 쓰면 로그인된 유저 정보 출력 가능
// passport.deserializeUser(async (user, done) => {
//   let result = await db.collection('user').findOne({_id : new ObjectId(user.id) })
//   delete result.password
//   process.nextTick(() => {
//     return done(null, result)
//   })
// })

// // Middleware to make user available in all templates
// app.use((req, res, next) => {
//   res.locals.currentUser = req.user;
//   next();
// });

// // Middleware to check if the user is authenticated
// function isAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.status(401).json({ message: 'Unauthorized' });
// }

// // Start the server
// const port = 8080;
// app.listen(port, async() => {
//   console.log(`Server is running on port ${port}`);
//   await connectToDb()
//   await updateRecords()
// });

// Start the server and update records
const startServer = async () => {
  await connectToDb(); // Connect to DB
  const port = 8080;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer();






// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/build/index.html'));
// });


// app.post('/login', async (req, res, next) => {
//   passport.authenticate('local', (error, user, info) => {
//     if (error) {
//       console.error('Authentication error:', error);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//     if (!user) {
//       return res.status(401).json({ message: info.message || 'Unauthorized' });
//     }
//     req.logIn(user, (err) => {
//       if (err) {
//         console.error('Login error:', err);
//         return next(err);
//       }
//       console.log(req.user)
//       return res.json({ message: 'Login successful' });
//     });
//   })(req, res, next);
// });

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db.collection('user').findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'No such user' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid); // Log the password comparison result
    if (!isPasswordValid) {
      console.log('Invalid credentials: Incorrect password');
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, secretKey, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).send('No token provided.');

  const token = authHeader.split(' ')[1];
  console.log('JWT token:', token);

  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err);
      return res.status(500).send('Failed to authenticate token.');
    }
    let user = await db.collection('user').findOne({ _id: new ObjectId(decoded.userId) })
    if (!user) {
      console.error('User not found or error:', err);
      return res.status(500).send('User not found.');
    }
    console.log('User found:', user);
    req.user = user;
    next();
  });
};


app.get('/loggedin', verifyToken, (req, res) => {
  console.log('Loggedin route called');
  if (req.user) {
    console.log('User is authenticated:', req.user);
    res.send(req.user);
  } else {
    console.log('User is not authenticated');
    res.status(401).json({ message: 'Not authenticated' });
  }
});

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

  const newUser = { username, name, email, password: hashedPassword, role, date: new Date(), my_exercises:[] };
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

// app.get('/protected', (req, res) => {
//   if (req.isAuthenticated()) {
//     res.status(200).json({ authenticated: true });
//   } else {
//     res.status(401).json({ authenticated: false });
//   } 
// });

app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// app.post('/logout', (req, res) => {
//   req.session.destroy((err) => {
//     if (err) {
//       return res.status(500).send('Failed to log out.');
//     }
//     res.clearCookie('connect.sid'); // Clear the session cookie
//     res.send('Logged out successfully.');
//   });
// });



app.post('/newSession', verifyToken,  async(req, res) => {
  let sessionName = req.body.sessionName
  try {
    const koreanDate = moment.tz(new Date(), "Asia/Seoul").format('YYYY-MM-DD');
    const result = await db.collection('workout_session').insertOne({
      name: req.body.sessionName,
      userId: req.user._id,
      date: koreanDate
    });
    console.log('Session created with ID:', result.insertedId);
    res.status(201).json({ message: 'Successfully made new workout session' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating session.');
  }
});

app.get('/sessions', verifyToken, async (req, res) => {
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

app.delete('/delete-session/:id', verifyToken, async (req, res) => {
  const sessionId = req.params.id;
  try {
    // Delete the session
    await db.collection('workout_session').deleteOne({ _id: new ObjectId(sessionId) });
    // Delete associated workout logs
    await db.collection('workout_records').deleteMany({ session: new ObjectId(sessionId) });

    res.json({ message: 'Session and associated workout logs deleted successfully' });
  } catch (error) {
    console.error('Error deleting session and workout logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/thisSession', verifyToken, async (req, res) => {
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
app.get('/workoutlogs/:id', verifyToken, async(req, res) => {
  var sessionId = req.params.id
  var session = await db.collection('workout_session').findOne({_id: new ObjectId(sessionId)})
  var workouts = await db.collection('workout_records').find({session: new ObjectId(sessionId)}).toArray()
  if(session){
    res.send({ session: session, workouts: workouts });
  }else{
    res.send('error')
  } 
});

app.post('/add-workout/:id', verifyToken, async (req, res) => {
  const { exercise, weight, reps } = req.body;

  // Fetch the session document
  const session = await db.collection('workout_session').findOne({ _id: new ObjectId(req.params.id) });

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
    date: session.date,
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

app.put('/editworkout/:workoutId', verifyToken, async (req, res) => {
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

app.delete('/deleteworkout/:workoutId', verifyToken, async (req, res) => {
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

app.get('/my-exercises',verifyToken, async(req, res) => {
  try {
    console.log('my exercises api called')
    const result = await db.collection('user').findOne({_id: new ObjectId(req.user._id)})
    if (!result) {
      return res.status(404).json({ message: 'User exercises not found' });
    }
    console.log(result.my_exercises)
    res.json(result.my_exercises); 
  } catch (error) {
    console.error('Error fetching user exercises:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

// Add my-exercise route
app.post('/add-my-exercise', verifyToken, async (req, res) => {
  const { exercise } = req.body;
  try {
    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $addToSet: { my_exercises: exercise } }
    );
    res.json({ message: 'Exercise added successfully' });
  } catch (error) {
    console.error('Error adding exercise:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/remove-my-exercise', verifyToken, async(req, res)=>{
  const { exercise } = req.body;
  try {
    await db.collection('user').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $pull: { my_exercises: exercise } }
    );
    res.json({ message: 'Exercise removed successfully' });
  } catch (error) {
    console.error('Error removing exercise:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

app.get('/workout-data', verifyToken, async (req, res) => {
  try {
    const { exercise, metric } = req.query;

    const workoutData = await db.collection('workout_records').aggregate([
      { $match: { athlete: new ObjectId(req.user._id), exercise: exercise } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          },
          maxWeight: { $max: "$weight" },
          workoutVolume: { $sum: { $multiply: ["$weight", "$reps"] } }
        }
      },
      { $sort: { _id: 1 } } // Sort by date
    ]).toArray();

    console.log(workoutData)

    let data = [];
    if (metric === 'max_weight') {
      data = workoutData.map(record => ({
        date: record._id,
        value: record.maxWeight
      }));
    } else if (metric === 'workout_volume') {
      data = workoutData.map(record => ({
        date: record._id,
        value: record.workoutVolume
      }));
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching workout data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('sessionWorkoutRecords', verifyToken, async (req, res) => {
  try {
    const records = await db.collection('workout_records').find({session: session}).toArray()
    res.send({records:records})
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'Error fetching workout records'})
  }
})

app.get('/programs', verifyToken, async(req, res) => {
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