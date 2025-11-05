const getSupabaseClient = require("../supabase.js");

// 1️⃣ Find user by email + password
const findUserByCredentials = async (email, password) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("password", password)
    .single(); // ✅ expect one row

  if (error || !data) {
    console.error("User not found or invalid credentials:", error);
    return null;
  }

  return data; // returns user object
};

// 2️⃣ Get fridge ID linked to user
const getFridgeIdByUser = async (userId) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("fridge")
    .select("fridge_id")
    .eq("user_id", userId)
    .single(); // expect one fridge per user

  if (error || !data) {
    console.warn("No fridge found for user:", userId);
    return null;
  }

  return data.fridge_id;
};

// 3️⃣ Combine both steps
const loginUser = async (email, password) => {
  try {
    const user = await findUserByCredentials(email, password);
    if (!user) return null;

    const fridgeId = await getFridgeIdByUser(user.user_id);

    const userWithFridge = { ...user, fridge_id: fridgeId };
    console.log("User with fridge:", userWithFridge);

    return userWithFridge;
  } catch (error) {
    console.error("Error in loginUser:", error);
    throw error;
  }
};

const addFridge = async (user_id) => {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("fridge")
      .insert([
        {
          user_id: user_id,
        },
      ])
      .select("fridge_id");

    if (error) {
      console.error("Error adding fridge:", error.message);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("❌ Error in addFridge:", error.message);
    throw error;
  }
};

const addUser = async (name, email, password) => {
  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username: name,
          email,
          password,
        },
      ])
      .select("user_id"); // optional: return inserted user

    if (error) {
      console.error("Error adding user:", error.message);
      throw error;
    }

    if (data) {
      const response = await addFridge(data[0].user_id);
      return response;
    } else {
      throw new Error("Fridge not added for new user");
    }
  } catch (error) {
    console.error("❌ Error in addUser:", error.message);
    throw error;
  }
};


// --- New profile-related helpers ---
const getUserById = async (userId) => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("user_id, username, email, created_at, image_url")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
};

const updateUserProfile = async (userId, { username, email }) => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .update({ username, email })
    .eq("user_id", userId)
    .select("user_id, username, email, image_url, created_at")
    .single();
  if (error) throw error;
  return data;
};

const updateUserPassword = async (userId, currentPassword, newPassword) => {
  const supabase = await getSupabaseClient();
  if (currentPassword) {
    const { data: existing, error: err1 } = await supabase
      .from("users")
      .select("password")
      .eq("user_id", userId)
      .single();
    if (err1) throw err1;
    if (!existing || existing.password !== currentPassword) return false;
  }
  const { error } = await supabase
    .from("users")
    .update({ password: newPassword })
    .eq("user_id", userId);
  if (error) throw error;
  return true;
};

const updateUserAvatar = async (userId, imageUrl) => {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .update({ image_url: imageUrl })
    .eq("user_id", userId)
    .select("user_id, username, email, image_url, created_at")
    .single();
  if (error) throw error;
  return data;
};

const deleteUserAndFridge = async (userId) => {
  const supabase = await getSupabaseClient();
  // Delete fridge items by user's fridge
  const fridgeId = await getFridgeIdByUser(userId);
  if (fridgeId) {
    await supabase.from("fridge_items").delete().eq("fridge_id", fridgeId);
    await supabase.from("fridge").delete().eq("fridge_id", fridgeId);
  }
  // Delete liked/recipes by this user (optional best-effort)
  await supabase.from("recipes").delete().eq("user_id", userId);
  // Finally delete user
  const { error } = await supabase.from("users").delete().eq("user_id", userId);
  if (error) throw error;
};


module.exports = {
  loginUser,
  findUserByCredentials,
  getFridgeIdByUser,
  addUser,
  getUserById,
  updateUserProfile,
  updateUserPassword,
  updateUserAvatar,
  deleteUserAndFridge,
};

/**
 * 1. allow signups (aka create users thru sql)
 *      i. [FE] make sure that the password and reconfirm password fields have the same value b4 sending to backend
 *      i. [BE] insert user info to user table first
 *      ii.[BE] make sure to create a fridge id for them (insert the new user's id into fridge table)
 * 2. allow user to login
 *      i. [BE] check credentials are inside the table (see if email and password are correct, if it is return user's fridge id and userid) [DONE]
 *      ii. [BE] generate bearer token authentication is above works in the controller file [DONE]
 *      iii. [FE] store user id and fridge id into session storage
 *      iv. [FE] redirect to main dashboard
 * 3. extra
 *    i. [BE] use google api to sign up and login
 *    ii. [BE] for sign up can create a function to check if the email and password is valid
 *
 */
