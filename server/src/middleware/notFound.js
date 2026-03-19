export function notFound(_req, res) {
  res.status(404).json({
    error: {
      message: "接口不存在。"
    }
  });
}

