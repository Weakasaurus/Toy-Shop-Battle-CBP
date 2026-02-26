import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
apiKey: "AIzaSyCuShXScvGDbQao1mDM2t1TFrohJ8zCJgs",
  authDomain: "toy-shop-battle.firebaseapp.com",
  projectId: "toy-shop-battle",
  storageBucket: "toy-shop-battle.firebasestorage.app",
  messagingSenderId: "787245289235",
  appId: "1:787245289235:web:5f02a72cc579e56b6594e6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

import { doc, setDoc } from "firebase/firestore";

async function testWrite() {
  await setDoc(doc(db, "testCollection", "testDoc"), {
    working: true
  });
}

testWrite();