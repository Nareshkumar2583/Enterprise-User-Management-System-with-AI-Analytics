import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class MongoCheck {
    public static void main(String[] args) {
        String uri = "mongodb+srv://naresh556:naresh556@cluster0.yzcwdck.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
        try (MongoClient mongoClient = MongoClients.create(uri)) {
            MongoDatabase database = mongoClient.getDatabase("enterprise-ai");
            MongoCollection<Document> collection = database.getCollection("notifications");
            
            System.out.println("Total Notifications: " + collection.countDocuments());
            for (Document doc : collection.find().sort(new Document("createdAt", -1)).limit(5)) {
                System.out.println("Notif: " + doc.toJson());
            }

            MongoCollection<Document> audit = database.getCollection("audit_logs");
            System.out.println("Recent Audits: " + audit.countDocuments());
             for (Document doc : audit.find().sort(new Document("timestamp", -1)).limit(5)) {
                System.out.println("Audit: " + doc.toJson());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
