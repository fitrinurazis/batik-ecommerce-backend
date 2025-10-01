const express = require("express");
const router = express.Router();
const SettingsService = require("../services/SettingsService");
const { authenticateToken } = require("../middleware/auth");

  /*  #swagger.tags = ['Settings'] */
router.get("/public", async (req, res) => {
  try {
    const settings = await SettingsService.getPublicSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error getting public settings:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil pengaturan publik",
    });
  }
});

  /*  #swagger.tags = ['Settings'] */
router.get("/categories", authenticateToken, async (req, res) => {
  try {
    const categories = await SettingsService.getAllCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil kategori pengaturan",
    });
  }
});

  /*  #swagger.tags = ['Settings'] */
router.get("/category/:category", authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const { include_private = false } = req.query;

    const settings = await SettingsService.getByCategory(
      category,
      include_private === "true"
    );
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error getting category settings:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil pengaturan kategori",
    });
  }
});

  /*  #swagger.tags = ['Settings'] */
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const { q, category } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Query pencarian diperlukan",
      });
    }

    const settings = await SettingsService.searchSettings(q, category);
    res.json({
      success: true,
      data: settings,
      query: q,
      category: category || null,
    });
  } catch (error) {
    console.error("Error searching settings:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mencari pengaturan",
    });
  }
});

  /*  #swagger.tags = ['Settings'] */
router.get("/key/:key", authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await SettingsService.getSettingDetails(key);

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: "Pengaturan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error("Error getting setting:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil detail pengaturan",
    });
  }
});

  /*  #swagger.tags = ['Settings'] */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { include_private = false } = req.query;
    const settings = await SettingsService.getAllSettings(
      include_private === "true"
    );

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error getting all settings:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil semua pengaturan",
    });
  }
});

  /*  #swagger.tags = ['Settings'] */
router.put("/key/:key", authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type, category, description, is_public } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: "Nilai pengaturan diperlukan",
      });
    }

    const result = await SettingsService.setByKey(key, value, {
      type,
      category,
      description,
      is_public,
    });

    res.json({
      success: true,
      data: {
        key,
        value: result,
      },
      message: "Pengaturan berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({
      success: false,
      error: "Gagal memperbarui pengaturan",
    });
  }
});

  /*  #swagger.tags = ['Settings'] */
router.put("/bulk", authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({
        success: false,
        error: "Data pengaturan tidak valid",
      });
    }

    const results = await SettingsService.updateSettings(settings);

    res.json({
      success: true,
      data: results,
      message: "Pengaturan berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error bulk updating settings:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Gagal memperbarui pengaturan",
    });
  }
});

  /*  #swagger.tags = ['Settings'] */
router.delete("/key/:key", authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    await SettingsService.deleteSetting(key);

    res.json({
      success: true,
      message: "Pengaturan berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting setting:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Gagal menghapus pengaturan",
    });
  }
});

  /*  #swagger.tags = ['Settings'] */
router.delete("/category/:category", authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    await SettingsService.resetCategory(category);

    res.json({
      success: true,
      message: "Kategori pengaturan berhasil direset",
    });
  } catch (error) {
    console.error("Error resetting category:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mereset kategori pengaturan",
    });
  }
});

module.exports = router;
