import {
    collection,
    doc,
    getDocs,
    getDownloadURL,
    ref,
    serverTimestamp,
    setDoc,
    uploadBytes
} from "../firebase/index.js";
import { state } from "../app/state.js";
import { translate } from "../app/i18n.js";
import { LONG_CACHE_CONTROL, optimizeImageForUpload } from "../utils/image-optimizer.js";

export async function fetchEventPhotos(db) {
    const snapshot = await getDocs(collection(db, "campusEventPhotos"));
    const photos = [];
    snapshot.forEach((item) => photos.push({ id: item.id, ...item.data() }));
    return photos.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
}

export async function createEventPhoto({ db, storage, user, title, caption, file }) {
    const photoRef = doc(collection(db, "campusEventPhotos"));
    const upload = await uploadEventImage(storage, user.uid, photoRef.id, file);

    await setDoc(photoRef, {
        uid: user.uid,
        authorName: state.customName || translate("fallback.explorer"),
        title,
        caption,
        imageUrl: upload.imageUrl,
        imagePath: upload.imagePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
}

async function uploadEventImage(storage, uid, photoId, file) {
    const optimizedFile = await optimizeImageForUpload(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82
    });
    const safeName = optimizedFile.name.replace(/[^\w.-]/g, "_");
    const imagePath = `campus-event-photos/${uid}/${photoId}/${Date.now()}-${safeName}`;
    const imageRef = ref(storage, imagePath);

    await uploadBytes(imageRef, optimizedFile, {
        contentType: optimizedFile.type,
        cacheControl: LONG_CACHE_CONTROL
    });
    const imageUrl = await getDownloadURL(imageRef);
    return { imageUrl, imagePath };
}

function getTime(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    return new Date(value).getTime() || 0;
}
