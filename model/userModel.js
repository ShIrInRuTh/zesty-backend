const supabase = require('../utils/supabaseClient');
const userLogin = async () => {
    try {
        return "App is working well";
    } catch (error) {
        return error;
    }
};

module.exports = healthCheck;


/**
 * 1. allow signups (aka create users thru sql)
 *      i. [FE] make sure that the password and reconfirm password fields have the same value b4 sending to backend
 *      i. [BE] insert user info to user table first
 *      ii.[BE] make sure to create a fridge id for them (insert the new user's id into fridge table)
 * 2. allow user to login
 *      i. [BE] check credentials are inside the table (see if email and password are correct, if it is return user's fridge id and userid)
 *      ii. [BE] generate bearer token authentication is above works in the controller file
 *      iii. [FE] store user id and fridge id into session storage
 *      iv. [FE] redirect to main dashboard
 * 3. extra
 *    i. [BE] use google api to sign up and login
 *    ii. [BE] for sign up can create a function to check if the email and password is valid
 * 
 */


// 1. Find user by email
const [userRows] = await db.query('SELECT id, password FROM users WHERE email = ?', [email]);
const user = userRows[0];
if (!user) {
  return res.status(401).json({ error: 'Email or password invalid' });
}

// 2. Check password (use bcrypt compare)
const valid = await bcrypt.compare(password, user.password);
if (!valid) {
  return res.status(401).json({ error: 'Email or password invalid' });
}

// 3. Get fridge id for this user
const [fridgeRows] = await db.query('SELECT fridge_id FROM fridge WHERE user_id = ?', [user.id]);
const fridge = fridgeRows[0];

// 4. Generate JWT bearer token
const token = jwt.sign(
  { userId: user.id, fridgeId: fridge.fridge_id }, // payload
  process.env.JWT_SECRET,
  { expiresIn: '2h' }
);

// 5. Respond with userId, fridgeId, and token
res.json({
  userId: user.id,
  fridgeId: fridge.fridge_id,
  token
});