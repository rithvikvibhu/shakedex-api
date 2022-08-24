const {container} = require('../container.js');
module.exports = {
  'GET /api/:v/stats': async (req, res) => {
    const statsDB = await container.resolve('StatsDB');
    const stats = await statsDB.getStats();
    res.status(200);
    res.json(stats);
  }
}