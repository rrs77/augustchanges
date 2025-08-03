import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize data files if they don't exist
const initializeDataFile = (filename, defaultData) => {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData), 'utf8');
  }
};

// Initialize with empty data structures
initializeDataFile('activities.json', []);
initializeDataFile('lessons.json', {});
initializeDataFile('lessonPlans.json', []);
initializeDataFile('eyfs.json', {});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes for activities
app.get('/api/activities', (req, res) => {
  try {
    const activities = JSON.parse(fs.readFileSync(path.join(dataDir, 'activities.json'), 'utf8'));
    res.json(activities);
  } catch (error) {
    console.error('Error reading activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.post('/api/activities', (req, res) => {
  try {
    const activities = JSON.parse(fs.readFileSync(path.join(dataDir, 'activities.json'), 'utf8'));
    const newActivity = req.body;
    
    // Generate a unique ID if not provided
    if (!newActivity._id) {
      newActivity._id = Date.now().toString();
    }
    
    activities.push(newActivity);
    fs.writeFileSync(path.join(dataDir, 'activities.json'), JSON.stringify(activities), 'utf8');
    
    res.status(201).json(newActivity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

app.put('/api/activities/:id', (req, res) => {
  try {
    const activities = JSON.parse(fs.readFileSync(path.join(dataDir, 'activities.json'), 'utf8'));
    const updatedActivity = req.body;
    const index = activities.findIndex(a => a._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    activities[index] = updatedActivity;
    fs.writeFileSync(path.join(dataDir, 'activities.json'), JSON.stringify(activities), 'utf8');
    
    res.json(updatedActivity);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

app.delete('/api/activities/:id', (req, res) => {
  try {
    const activities = JSON.parse(fs.readFileSync(path.join(dataDir, 'activities.json'), 'utf8'));
    const filteredActivities = activities.filter(a => a._id !== req.params.id);
    
    if (filteredActivities.length === activities.length) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    fs.writeFileSync(path.join(dataDir, 'activities.json'), JSON.stringify(filteredActivities), 'utf8');
    
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// Routes for lessons
app.get('/api/lessons/:sheet', (req, res) => {
  try {
    const lessons = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessons.json'), 'utf8'));
    const sheetLessons = lessons[req.params.sheet] || {};
    res.json(sheetLessons);
  } catch (error) {
    console.error('Error reading lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

app.post('/api/lessons/:sheet', (req, res) => {
  try {
    const lessons = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessons.json'), 'utf8'));
    const sheetData = req.body;
    
    lessons[req.params.sheet] = sheetData;
    fs.writeFileSync(path.join(dataDir, 'lessons.json'), JSON.stringify(lessons), 'utf8');
    
    res.status(201).json(sheetData);
  } catch (error) {
    console.error('Error updating lessons:', error);
    res.status(500).json({ error: 'Failed to update lessons' });
  }
});

// Routes for lesson plans
app.get('/api/lessonPlans', (req, res) => {
  try {
    const lessonPlans = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessonPlans.json'), 'utf8'));
    res.json(lessonPlans);
  } catch (error) {
    console.error('Error reading lesson plans:', error);
    res.status(500).json({ error: 'Failed to fetch lesson plans' });
  }
});

app.post('/api/lessonPlans', (req, res) => {
  try {
    const lessonPlans = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessonPlans.json'), 'utf8'));
    const newLessonPlan = req.body;
    
    // Generate a unique ID if not provided
    if (!newLessonPlan.id) {
      newLessonPlan.id = `plan-${Date.now()}`;
    }
    
    lessonPlans.push(newLessonPlan);
    fs.writeFileSync(path.join(dataDir, 'lessonPlans.json'), JSON.stringify(lessonPlans), 'utf8');
    
    res.status(201).json(newLessonPlan);
  } catch (error) {
    console.error('Error creating lesson plan:', error);
    res.status(500).json({ error: 'Failed to create lesson plan' });
  }
});

app.put('/api/lessonPlans/:id', (req, res) => {
  try {
    const lessonPlans = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessonPlans.json'), 'utf8'));
    const updatedPlan = req.body;
    const index = lessonPlans.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }
    
    lessonPlans[index] = updatedPlan;
    fs.writeFileSync(path.join(dataDir, 'lessonPlans.json'), JSON.stringify(lessonPlans), 'utf8');
    
    res.json(updatedPlan);
  } catch (error) {
    console.error('Error updating lesson plan:', error);
    res.status(500).json({ error: 'Failed to update lesson plan' });
  }
});

// Routes for EYFS standards
app.get('/api/eyfs/:sheet', (req, res) => {
  try {
    const eyfs = JSON.parse(fs.readFileSync(path.join(dataDir, 'eyfs.json'), 'utf8'));
    const sheetEyfs = eyfs[req.params.sheet] || {};
    res.json(sheetEyfs);
  } catch (error) {
    console.error('Error reading EYFS standards:', error);
    res.status(500).json({ error: 'Failed to fetch EYFS standards' });
  }
});

app.post('/api/eyfs/:sheet', (req, res) => {
  try {
    const eyfs = JSON.parse(fs.readFileSync(path.join(dataDir, 'eyfs.json'), 'utf8'));
    const sheetData = req.body;
    
    eyfs[req.params.sheet] = sheetData;
    fs.writeFileSync(path.join(dataDir, 'eyfs.json'), JSON.stringify(eyfs), 'utf8');
    
    res.status(201).json(sheetData);
  } catch (error) {
    console.error('Error updating EYFS standards:', error);
    res.status(500).json({ error: 'Failed to update EYFS standards' });
  }
});

// Bulk import endpoint
app.post('/api/import', (req, res) => {
  try {
    const { activities, lessons, lessonPlans, eyfs } = req.body;
    
    if (activities) {
      fs.writeFileSync(path.join(dataDir, 'activities.json'), JSON.stringify(activities), 'utf8');
    }
    
    if (lessons) {
      fs.writeFileSync(path.join(dataDir, 'lessons.json'), JSON.stringify(lessons), 'utf8');
    }
    
    if (lessonPlans) {
      fs.writeFileSync(path.join(dataDir, 'lessonPlans.json'), JSON.stringify(lessonPlans), 'utf8');
    }
    
    if (eyfs) {
      fs.writeFileSync(path.join(dataDir, 'eyfs.json'), JSON.stringify(eyfs), 'utf8');
    }
    
    res.json({ message: 'Data imported successfully' });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Export all data
app.get('/api/export', (req, res) => {
  try {
    const activities = JSON.parse(fs.readFileSync(path.join(dataDir, 'activities.json'), 'utf8'));
    const lessons = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessons.json'), 'utf8'));
    const lessonPlans = JSON.parse(fs.readFileSync(path.join(dataDir, 'lessonPlans.json'), 'utf8'));
    const eyfs = JSON.parse(fs.readFileSync(path.join(dataDir, 'eyfs.json'), 'utf8'));
    
    res.json({
      activities,
      lessons,
      lessonPlans,
      eyfs
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});