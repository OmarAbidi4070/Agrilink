const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")))
}

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/agrilink", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err))

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "agrilink-secret-key"

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Seules les images sont autorisées"))
    }
  },
})

// Models
// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  crops: [String],
  expertise: String,
  equipment: [String],
  experience: Number,
  createdAt: { type: Date, default: Date.now },
})

userSchema.index({ location: "2dsphere" })

const User = mongoose.model("User", userSchema)

// Conversation Model
const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const Conversation = mongoose.model("Conversation", conversationSchema)

// Message Model
const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const Message = mongoose.model("Message", messageSchema)

// Disease Model
const diseaseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  symptoms: [String],
  treatment: String,
  affectedCrops: [String],
  images: [String],
})

const Disease = mongoose.model("Disease", diseaseSchema)

// Diagnosis Model
const diagnosisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  disease: { type: mongoose.Schema.Types.ObjectId, ref: "Disease" },
  image: { type: String, required: true },
  confidence: Number,
  notes: String,
  isShared: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

const Diagnosis = mongoose.model("Diagnosis", diagnosisSchema)

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "Authentification requise" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" })
    }

    req.user = user
    req.token = token
    next()
  } catch (error) {
    res.status(401).json({ message: "Veuillez vous authentifier" })
  }
}

// Routes

// Auth Routes
// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, latitude, longitude, crops, expertise, equipment, experience } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // MongoDB uses [longitude, latitude]
      },
      crops: crops || [],
      expertise,
      equipment: equipment || [],
      experience: experience || 0
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// User Routes
// Get current user profile
app.get('/api/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
});

// Update user profile
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { name, crops, expertise, equipment, experience, latitude, longitude } = req.body;
    
    const updateData = {
      name,
      crops,
      expertise,
      equipment,
      experience
    };
    
    if (latitude && longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      };
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
});

// Farmers Routes
// Get nearby farmers
app.get('/api/farmers', auth, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance, cropType, expertise, equipment } = req.query;
    
    // Default to user's location if not provided
    const userLongitude = longitude || req.user.location.coordinates[0];
    const userLatitude = latitude || req.user.location.coordinates[1];
    const distance = maxDistance ? Number.parseInt(maxDistance) : 50000; // Default 50km
    
    const query = {
      _id: { $ne: req.user._id }, // Exclude current user
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number.parseFloat(userLongitude), Number.parseFloat(userLatitude)]
          },
          $maxDistance: distance
        }
      }
    };
    
    // Add filters if provided
    if (cropType) {
      query.crops = { $in: [cropType] };
    }
    
    if (expertise) {
      query.expertise = expertise;
    }
    
    if (equipment) {
      query.equipment = { $in: [equipment] };
    }
    
    const farmers = await User.find(query).select('-password');
    res.json(farmers);
  } catch (error) {
    console.error('Get farmers error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des agriculteurs' });
  }
});

// Conversation Routes
// Get user conversations
app.get('/api/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate({
      path: 'participants',
      select: 'name'
    })
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
    
    // Format the response to include recipient info
    const formattedConversations = conversations.map(conv => {
      const recipient = conv.participants.find(p => p._id.toString() !== req.user._id.toString());
      return {
        _id: conv._id,
        recipient: recipient,
        lastMessage: conv.lastMessage,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    });
    
    res.json(formattedConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des conversations' });
  }
});

// Create new conversation
app.post('/api/conversations', auth, async (req, res) => {
  try {
    const { recipient } = req.body;
    
    // Check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Destinataire non trouvé' });
    }
    
    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipient] }
    })
    .populate({
      path: 'participants',
      select: 'name'
    });
    
    if (existingConversation) {
      const recipientInfo = existingConversation.participants.find(
        p => p._id.toString() !== req.user._id.toString()
      );
      
      return res.json({
        _id: existingConversation._id,
        recipient: recipientInfo,
        lastMessage: existingConversation.lastMessage,
        createdAt: existingConversation.createdAt,
        updatedAt: existingConversation.updatedAt
      });
    }
    
    // Create new conversation
    const newConversation = new Conversation({
      participants: [req.user._id, recipient]
    });
    
    await newConversation.save();
    
    // Populate and format response
    await newConversation.populate({
      path: 'participants',
      select: 'name'
    });
    
    const recipientInfo = newConversation.participants.find(
      p => p._id.toString() !== req.user._id.toString()
    );
    
    res.status(201).json({
      _id: newConversation._id,
      recipient: recipientInfo,
      createdAt: newConversation.createdAt,
      updatedAt: newConversation.updatedAt
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la conversation' });
  }
});

// Message Routes
// Get messages for a conversation
app.get('/api/messages/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });
    
    if (!conversation) {
      return res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
    }
    
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
});

// Send a message
app.post('/api/messages', auth, async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    
    if (!content.trim()) {
      return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }
    
    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });
    
    if (!conversation) {
      return res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
    }
    
    // Create new message
    const newMessage = new Message({
      conversation: conversationId,
      sender: req.user._id,
      content
    });
    
    await newMessage.save();
    
    // Update conversation's lastMessage and updatedAt
    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = Date.now();
    await conversation.save();
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
});

// Disease Diagnosis Routes
// Upload and diagnose plant image
app.post('/api/diagnose', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }
    
    const imagePath = req.file.path;
    
    // In a real app, here you would call an AI service to analyze the image
    // For this demo, we'll simulate a diagnosis result
    
    // Get random disease for demo purposes
    const diseases = await Disease.find();
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    
    if (!randomDisease) {
      // If no diseases in DB, create a mock result
      const mockDiagnosis = {
        diseaseName: "Mildiou de la tomate",
        confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
        description: "Le mildiou est une maladie fongique qui affecte les feuilles, les tiges et les fruits.",
        treatment: "Appliquer un fongicide à base de cuivre et améliorer la circulation d'air autour des plantes."
      };
      
      // Save diagnosis to database
      const newDiagnosis = new Diagnosis({
        user: req.user._id,
        image: imagePath,
        confidence: mockDiagnosis.confidence,
        notes: "Diagnostic automatique"
      });
      
      await newDiagnosis.save();
      
      return res.json({
        _id: newDiagnosis._id,
        ...mockDiagnosis
      });
    }
    
    // Create a real diagnosis with the random disease
    const newDiagnosis = new Diagnosis({
      user: req.user._id,
      disease: randomDisease._id,
      image: imagePath,
      confidence: Math.floor(Math.random() * 30) + 70, // 70-99%
      notes: "Diagnostic automatique"
    });
    
    await newDiagnosis.save();
    
    res.json({
      _id: newDiagnosis._id,
      diseaseName: randomDisease.name,
      confidence: newDiagnosis.confidence,
      description: randomDisease.description,
      treatment: randomDisease.treatment
    });
  } catch (error) {
    console.error('Diagnose error:', error);
    res.status(500).json({ message: 'Erreur lors du diagnostic' });
  }
});

// Share diagnosis with community
app.post('/api/share-diagnosis', auth, async (req, res) => {
  try {
    const { diagnosisId } = req.body;
    
    const diagnosis = await Diagnosis.findOne({
      _id: diagnosisId,
      user: req.user._id
    });
    
    if (!diagnosis) {
      return res.status(404).json({ message: 'Diagnostic non trouvé' });
    }
    
    diagnosis.isShared = true;
    await diagnosis.save();
    
    res.json({ message: 'Diagnostic partagé avec succès' });
  } catch (error) {
    console.error('Share diagnosis error:', error);
    res.status(500).json({ message: 'Erreur lors du partage du diagnostic' });
  }
});

// Get community shared diagnoses
app.get('/api/community-diagnoses', auth, async (req, res) => {
  try {
    const { crop } = req.query;
    
    // Get user's crops
    const userCrops = req.user.crops;
    
    const query = {
      isShared: true
    };
    
    if (crop) {
      // Filter by specific crop
      query['disease.affectedCrops'] = crop;
    } else if (userCrops && userCrops.length > 0) {
      // Filter by user's crops
      query['disease.affectedCrops'] = { $in: userCrops };
    }
    
    const diagnoses = await Diagnosis.find(query)
      .populate('user', 'name')
      .populate('disease')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(diagnoses);
  } catch (error) {
    console.error('Get community diagnoses error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des diagnostics communautaires' });
  }
});

// Seed initial diseases data if none exist
const seedDiseases = async () => {
  try {
    const count = await Disease.countDocuments();
    
    if (count === 0) {
      const diseases = [
        {
          name: "Mildiou de la tomate",
          description: "Le mildiou est une maladie fongique qui affecte les feuilles, les tiges et les fruits des tomates.",
          symptoms: ["Taches brunes sur les feuilles", "Pourriture des fruits", "Lésions sur les tiges"],
          treatment: "Appliquer un fongicide à base de cuivre et améliorer la circulation d'air autour des plantes.",
          affectedCrops: ["tomates", "pommes de terre"]
        },
        {
          name: "Oïdium",
          description: "L'oïdium est une maladie fongique qui se manifeste par un revêtement blanc poudreux sur les feuilles et les tiges.",
          symptoms: ["Poudre blanche sur les feuilles", "Jaunissement des feuilles", "Déformation des nouvelles pousses"],
          treatment: "Appliquer du soufre ou un fongicide spécifique. Éviter l'arrosage par le dessus.",
          affectedCrops: ["céréales", "vignes", "légumes"]
        },
        {
          name: "Rouille du blé",
          description: "La rouille est une maladie fongique qui forme des pustules de couleur rouille sur les feuilles et les tiges.",
          symptoms: ["Pustules orange-brunes", "Feuilles qui se dessèchent", "Réduction du rendement"],
          treatment: "Utiliser des variétés résistantes et appliquer des fongicides préventifs.",
          affectedCrops: ["blé", "céréales"]
        },
        {
          name: "Tavelure du pommier",
          description: "La tavelure est une maladie fongique qui affecte principalement les pommiers et les poiriers.",
          symptoms: ["Taches olive-noires sur les feuilles", "Lésions sur les fruits", "Craquelures sur les fruits"],
          treatment: "Appliquer des fongicides préventifs au printemps et éliminer les feuilles mortes en automne.",
          affectedCrops: ["pommiers", "poiriers"]
        },
        {
          name: "Mildiou de la vigne",
          description: "Le mildiou de la vigne est une maladie fongique qui peut détruire rapidement les feuilles et les grappes.",
          symptoms: ["Taches jaunes huileuses", "Duvet blanc sous les feuilles", "Brunissement des grappes"],
          treatment: "Appliquer des fongicides à base de cuivre ou de soufre et tailler pour améliorer l'aération.",
          affectedCrops: ["vignes"]
        }
      ];
      
      await Disease.insertMany(diseases);
      console.log('Maladies de plantes ajoutées à la base de données');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des maladies:', error);
  }
};

// Catch-all route to serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, async () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  await seedDiseases();
});