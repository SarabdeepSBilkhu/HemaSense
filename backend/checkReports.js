const mongoose = require('mongoose');
const Report = require('./models/Report');
const User = require('./models/User');

async function checkReports() {
  await mongoose.connect('mongodb://127.0.0.1:27017/HemaSense');
  const user = await User.findOne({ email: 'guest@hemasense.ai' });
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  const reports = await Report.find({ user: user._id });
  console.log(`Found ${reports.length} reports for ${user.email}`);
  reports.forEach((r, i) => {
    const params = r.results.map(res => res.name);
    console.log(`Report ${i+1} (${r.date}): [${params.join(', ')}]`);
  });
  mongoose.connection.close();
}

checkReports();
