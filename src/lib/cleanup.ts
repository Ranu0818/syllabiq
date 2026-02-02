import { db } from "./firebase";
import { collection, query, where, getDocs, deleteDoc } from "firebase/firestore";

/**
 * Cleanup chat messages older than 2 days for a specific user
 */
export async function cleanupOldMessages(userId: string): Promise<number> {
    try {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        // Query by user_id ONLY to avoid composite index requirement
        const q = query(
            collection(db, "chat_messages"),
            where("user_id", "==", userId)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return 0;
        }

        // Filter in memory for messages older than 2 days
        const docsToDelete = snapshot.docs.filter(doc => {
            const data = doc.data();
            // Assuming created_at is an ISO string or similar
            return data.created_at < twoDaysAgo.toISOString();
        });

        if (docsToDelete.length === 0) return 0;

        const deletePromises = docsToDelete.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`[Cleanup] Deleted ${snapshot.size} old messages for user ${userId}`);
        return snapshot.size;
    } catch (error) {
        console.error("[Cleanup] Error deleting old messages:", error);
        return 0;
    }
}
