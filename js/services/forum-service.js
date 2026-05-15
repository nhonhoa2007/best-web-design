import {
    collection,
    deleteDoc,
    deleteObject,
    doc,
    getDoc,
    getDocs,
    getDownloadURL,
    query,
    ref,
    serverTimestamp,
    setDoc,
    updateDoc,
    uploadBytes,
    where
} from "../firebase/index.js";
import { state } from "../app/state.js";
import { translate } from "../app/i18n.js";
import { LONG_CACHE_CONTROL, optimizeImageForUpload } from "../utils/image-optimizer.js";

const FORUM_CATEGORIES = new Set(["event", "question", "club", "notice"]);

export async function fetchForumThreads(db, category = "all") {
    const snapshot = await getDocs(collection(db, "forumThreads"));
    const replyCounts = await fetchReplyCounts(db);
    const threads = [];

    snapshot.forEach((item) => {
        const thread = { id: item.id, ...item.data() };
        if (category !== "all" && thread.category !== category) return;

        thread.replyCount = Math.max(Number(thread.replyCount) || 0, replyCounts.get(item.id) || 0);
        threads.push(thread);
    });

    return threads.sort((a, b) => getTime(b.lastActivityAt || b.createdAt) - getTime(a.lastActivityAt || a.createdAt));
}

export async function getForumThread(db, threadId) {
    if (!threadId) return null;

    const snapshot = await getDoc(doc(db, "forumThreads", threadId));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function fetchForumReplies(db, threadId) {
    const snapshot = await getDocs(query(
        collection(db, "forumReplies"),
        where("threadId", "==", threadId)
    ));
    const replies = [];

    snapshot.forEach((item) => replies.push({ id: item.id, ...item.data() }));
    return replies.sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt));
}

export async function createForumThread({ db, storage, user, title, body, category, file }) {
    const threadRef = doc(collection(db, "forumThreads"));
    const payload = {
        uid: user.uid,
        authorName: state.customName || translate("fallback.explorer"),
        title,
        body,
        category: FORUM_CATEGORIES.has(category) ? category : "event",
        imageUrl: "",
        imagePath: "",
        replyCount: 0,
        reactionCount: 0,
        lastActivityAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    if (file) {
        const upload = await uploadForumImage(storage, user.uid, threadRef.id, file);
        payload.imageUrl = upload.imageUrl;
        payload.imagePath = upload.imagePath;
    }

    await setDoc(threadRef, payload);
    return threadRef.id;
}

export async function createForumReply({ db, user, threadId, body }) {
    const replyRef = doc(collection(db, "forumReplies"));
    await setDoc(replyRef, {
        threadId,
        uid: user.uid,
        authorName: state.customName || translate("fallback.explorer"),
        body,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    const threadRef = doc(db, "forumThreads", threadId);
    const threadSnapshot = await getDoc(threadRef);
    const previousCount = threadSnapshot.exists() ? Number(threadSnapshot.data().replyCount) || 0 : 0;
    await updateDoc(threadRef, {
        replyCount: previousCount + 1,
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return replyRef.id;
}

export async function deleteForumThread({ db, storage, threadId, imagePath }) {
    if (!threadId) return;

    await deleteDoc(doc(db, "forumThreads", threadId));

    if (imagePath) {
        await deleteForumImage(storage, imagePath);
    }
}

async function fetchReplyCounts(db) {
    const counts = new Map();
    const snapshot = await getDocs(collection(db, "forumReplies"));

    snapshot.forEach((item) => {
        const reply = item.data();
        if (!reply.threadId) return;
        counts.set(reply.threadId, (counts.get(reply.threadId) || 0) + 1);
    });

    return counts;
}

async function uploadForumImage(storage, uid, threadId, file) {
    const optimizedFile = await optimizeImageForUpload(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82
    });
    const safeName = optimizedFile.name.replace(/[^\w.-]/g, "_");
    const imagePath = `forum-attachments/${uid}/${threadId}/${Date.now()}-${safeName}`;
    const imageRef = ref(storage, imagePath);

    await uploadBytes(imageRef, optimizedFile, {
        contentType: optimizedFile.type,
        cacheControl: LONG_CACHE_CONTROL
    });
    const imageUrl = await getDownloadURL(imageRef);
    return { imageUrl, imagePath };
}

async function deleteForumImage(storage, imagePath) {
    if (!storage || !imagePath) return;

    try {
        await deleteObject(ref(storage, imagePath));
    } catch (error) {
        console.warn("Forum attachment delete skipped:", error);
    }
}

function getTime(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    return new Date(value).getTime() || 0;
}
