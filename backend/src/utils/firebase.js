import admin from "firebase-admin";

let initialized = false;

const getFirebaseAdmin = () => {
  if (!initialized) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    initialized = true;
  }
  return admin;
};

export const verifyFirebaseToken = async (idToken) => {
  const decodedToken = await getFirebaseAdmin().auth().verifyIdToken(idToken);
  return decodedToken;
};
