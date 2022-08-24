module.exports = {
  'GET /api/:v/fee_info': async (req, res) => {
    res.status(200);
    res.json({
      rate: process.env.FEE_RATE || 0,
      addr: process.env.FEE_ADDR || null,
    });
  },
};