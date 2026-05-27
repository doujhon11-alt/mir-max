function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!process.env.PERSONAL_API_KEY) {
    return res.status(500).json({
      success: false,
      message: 'PERSONAL_API_KEY is not configured'
    });
  }

  if (!apiKey || apiKey !== process.env.PERSONAL_API_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Неверный API ключ'
    });
  }

  next();
}

module.exports = apiKeyAuth;
