import { supabase } from "./client.js";

document.getElementById("loginBtn").onclick =
async () => {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if(error){
    alert(error.message);
    return;
  }

  location.href = "./admin.html";
};

document.getElementById("googleBtn").onclick =
async () => {

  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        window.location.origin + "/admin.html"
    }
  });
};