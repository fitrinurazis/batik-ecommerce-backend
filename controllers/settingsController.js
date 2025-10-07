const { Setting } = require('../models/sequelize');

const settingsController = {
  // Public: Get payment methods untuk customer
  async getPaymentMethods(req, res) {
    try {
      // Get bank accounts
      const bankAccountsSetting = await Setting.findOne({
        where: { key: 'bank_accounts', is_public: true }
      });

      // Get e-wallet accounts
      const ewalletAccountsSetting = await Setting.findOne({
        where: { key: 'ewallet_accounts', is_public: true }
      });

      // Get COD fee
      const codFeeSetting = await Setting.findOne({
        where: { key: 'cod_fee', is_public: true }
      });

      // Get enabled payment methods
      const enabledMethodsSetting = await Setting.findOne({
        where: { key: 'payment_methods_enabled', is_public: true }
      });

      let bankAccounts = bankAccountsSetting ? bankAccountsSetting.getParsedValue() : [];
      let ewalletAccounts = ewalletAccountsSetting ? ewalletAccountsSetting.getParsedValue() : [];
      const codFee = codFeeSetting ? codFeeSetting.getParsedValue() : 5000;
      const enabledMethods = enabledMethodsSetting ? enabledMethodsSetting.getParsedValue() : {
        bank_transfer: true,
        ewallet: true,
        cod: true
      };

      // Normalize and ensure all bank accounts have required fields
      bankAccounts = bankAccounts.map(account => {
        const bankName = account.bank_name || account.bank || 'Unknown Bank';
        return {
          id: account.id || bankName.toLowerCase().replace(/\s+/g, '_'),
          bank_name: bankName,
          account_number: account.account_number || '',
          account_holder: account.account_holder || 'PT Batik Nusantara Indonesia',
          branch: account.branch || '',
          is_active: account.is_active !== undefined ? account.is_active : true
        };
      });

      // Normalize and ensure all ewallet accounts have required fields
      ewalletAccounts = ewalletAccounts.map(account => {
        const provider = account.provider || 'Unknown Provider';
        return {
          id: account.id || provider.toLowerCase().replace(/\s+/g, '_'),
          provider: provider,
          account_number: account.account_number || '',
          account_holder: account.account_holder || 'PT Batik Nusantara Indonesia',
          is_active: account.is_active !== undefined ? account.is_active : true
        };
      });

      // Filter only active accounts
      const activeBankAccounts = bankAccounts.filter(account => account.is_active);
      const activeEwalletAccounts = ewalletAccounts.filter(account => account.is_active);

      res.json({
        bank_accounts: activeBankAccounts,
        ewallet_accounts: activeEwalletAccounts,
        cod_fee: codFee,
        enabled_methods: enabledMethods
      });

    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({ error: 'Gagal mengambil data metode pembayaran' });
    }
  },

  // Admin: Get all payment settings
  async getPaymentSettings(req, res) {
    try {
      const settings = await Setting.findAll({
        where: { category: 'payment' },
        order: [['key', 'ASC']]
      });

      const formattedSettings = {};
      settings.forEach(setting => {
        formattedSettings[setting.key] = {
          value: setting.getParsedValue(),
          type: setting.type,
          description: setting.description,
          is_public: setting.is_public
        };
      });

      res.json(formattedSettings);

    } catch (error) {
      console.error('Error fetching payment settings:', error);
      res.status(500).json({ error: 'Gagal mengambil pengaturan pembayaran' });
    }
  },

  // Admin: Update payment settings
  async updatePaymentSettings(req, res) {
    try {
      const { bank_accounts, ewallet_accounts, cod_fee, payment_methods_enabled } = req.body;

      // Update bank accounts
      if (bank_accounts !== undefined) {
        await Setting.upsert({
          key: 'bank_accounts',
          value: JSON.stringify(bank_accounts),
          type: 'json',
          category: 'payment',
          description: 'Bank account configurations',
          is_public: true
        });
      }

      // Update e-wallet accounts
      if (ewallet_accounts !== undefined) {
        await Setting.upsert({
          key: 'ewallet_accounts',
          value: JSON.stringify(ewallet_accounts),
          type: 'json',
          category: 'payment',
          description: 'E-wallet account configurations',
          is_public: true
        });
      }

      // Update COD fee
      if (cod_fee !== undefined) {
        await Setting.upsert({
          key: 'cod_fee',
          value: String(cod_fee),
          type: 'number',
          category: 'payment',
          description: 'COD service fee',
          is_public: true
        });
      }

      // Update enabled payment methods
      if (payment_methods_enabled !== undefined) {
        await Setting.upsert({
          key: 'payment_methods_enabled',
          value: JSON.stringify(payment_methods_enabled),
          type: 'json',
          category: 'payment',
          description: 'Enabled payment methods',
          is_public: true
        });
      }

      res.json({ message: 'Pengaturan pembayaran berhasil diperbarui' });

    } catch (error) {
      console.error('Error updating payment settings:', error);
      res.status(500).json({ error: 'Gagal memperbarui pengaturan pembayaran' });
    }
  },

  // Admin: Add bank account
  async addBankAccount(req, res) {
    try {
      const { bank_name, account_number, account_holder, branch } = req.body;

      const bankAccountsSetting = await Setting.findOne({
        where: { key: 'bank_accounts' }
      });

      let bankAccounts = bankAccountsSetting ? bankAccountsSetting.getParsedValue() : [];

      // Generate ID from bank name
      const id = bank_name.toLowerCase().replace(/\s+/g, '_');

      // Add new bank account
      bankAccounts.push({
        id,
        bank_name,
        account_number,
        account_holder,
        branch,
        is_active: true
      });

      await Setting.upsert({
        key: 'bank_accounts',
        value: JSON.stringify(bankAccounts),
        type: 'json',
        category: 'payment',
        description: 'Bank account configurations',
        is_public: true
      });

      res.json({ message: 'Rekening bank berhasil ditambahkan', bankAccounts });

    } catch (error) {
      console.error('Error adding bank account:', error);
      res.status(500).json({ error: 'Gagal menambahkan rekening bank' });
    }
  },

  // Admin: Update bank account
  async updateBankAccount(req, res) {
    try {
      const { index } = req.params;
      const { bank_name, account_number, account_holder, branch, is_active } = req.body;

      const bankAccountsSetting = await Setting.findOne({
        where: { key: 'bank_accounts' }
      });

      if (!bankAccountsSetting) {
        return res.status(404).json({ error: 'Pengaturan rekening bank tidak ditemukan' });
      }

      let bankAccounts = bankAccountsSetting.getParsedValue();

      if (index < 0 || index >= bankAccounts.length) {
        return res.status(404).json({ error: 'Rekening bank tidak ditemukan' });
      }

      // Update bank account
      bankAccounts[index] = {
        ...bankAccounts[index],
        bank_name: bank_name !== undefined ? bank_name : bankAccounts[index].bank_name,
        account_number: account_number !== undefined ? account_number : bankAccounts[index].account_number,
        account_holder: account_holder !== undefined ? account_holder : bankAccounts[index].account_holder,
        branch: branch !== undefined ? branch : bankAccounts[index].branch,
        is_active: is_active !== undefined ? is_active : bankAccounts[index].is_active
      };

      await bankAccountsSetting.update({
        value: JSON.stringify(bankAccounts)
      });

      res.json({ message: 'Rekening bank berhasil diperbarui', bankAccounts });

    } catch (error) {
      console.error('Error updating bank account:', error);
      res.status(500).json({ error: 'Gagal memperbarui rekening bank' });
    }
  },

  // Admin: Delete bank account
  async deleteBankAccount(req, res) {
    try {
      const { index } = req.params;

      const bankAccountsSetting = await Setting.findOne({
        where: { key: 'bank_accounts' }
      });

      if (!bankAccountsSetting) {
        return res.status(404).json({ error: 'Pengaturan rekening bank tidak ditemukan' });
      }

      let bankAccounts = bankAccountsSetting.getParsedValue();

      if (index < 0 || index >= bankAccounts.length) {
        return res.status(404).json({ error: 'Rekening bank tidak ditemukan' });
      }

      // Remove bank account
      bankAccounts.splice(index, 1);

      await bankAccountsSetting.update({
        value: JSON.stringify(bankAccounts)
      });

      res.json({ message: 'Rekening bank berhasil dihapus', bankAccounts });

    } catch (error) {
      console.error('Error deleting bank account:', error);
      res.status(500).json({ error: 'Gagal menghapus rekening bank' });
    }
  },

  // Admin: Add e-wallet account
  async addEwalletAccount(req, res) {
    try {
      const { provider, account_number, account_holder } = req.body;

      const ewalletAccountsSetting = await Setting.findOne({
        where: { key: 'ewallet_accounts' }
      });

      let ewalletAccounts = ewalletAccountsSetting ? ewalletAccountsSetting.getParsedValue() : [];

      // Generate ID from provider name
      const id = provider.toLowerCase().replace(/\s+/g, '_');

      // Add new e-wallet account
      ewalletAccounts.push({
        id,
        provider,
        account_number,
        account_holder,
        is_active: true
      });

      await Setting.upsert({
        key: 'ewallet_accounts',
        value: JSON.stringify(ewalletAccounts),
        type: 'json',
        category: 'payment',
        description: 'E-wallet account configurations',
        is_public: true
      });

      res.json({ message: 'Akun e-wallet berhasil ditambahkan', ewalletAccounts });

    } catch (error) {
      console.error('Error adding e-wallet account:', error);
      res.status(500).json({ error: 'Gagal menambahkan akun e-wallet' });
    }
  },

  // Admin: Update e-wallet account
  async updateEwalletAccount(req, res) {
    try {
      const { index } = req.params;
      const { provider, account_number, account_holder, is_active } = req.body;

      const ewalletAccountsSetting = await Setting.findOne({
        where: { key: 'ewallet_accounts' }
      });

      if (!ewalletAccountsSetting) {
        return res.status(404).json({ error: 'Pengaturan e-wallet tidak ditemukan' });
      }

      let ewalletAccounts = ewalletAccountsSetting.getParsedValue();

      if (index < 0 || index >= ewalletAccounts.length) {
        return res.status(404).json({ error: 'Akun e-wallet tidak ditemukan' });
      }

      // Update e-wallet account
      ewalletAccounts[index] = {
        ...ewalletAccounts[index],
        provider: provider !== undefined ? provider : ewalletAccounts[index].provider,
        account_number: account_number !== undefined ? account_number : ewalletAccounts[index].account_number,
        account_holder: account_holder !== undefined ? account_holder : ewalletAccounts[index].account_holder,
        is_active: is_active !== undefined ? is_active : ewalletAccounts[index].is_active
      };

      await ewalletAccountsSetting.update({
        value: JSON.stringify(ewalletAccounts)
      });

      res.json({ message: 'Akun e-wallet berhasil diperbarui', ewalletAccounts });

    } catch (error) {
      console.error('Error updating e-wallet account:', error);
      res.status(500).json({ error: 'Gagal memperbarui akun e-wallet' });
    }
  },

  // Admin: Delete e-wallet account
  async deleteEwalletAccount(req, res) {
    try {
      const { index } = req.params;

      const ewalletAccountsSetting = await Setting.findOne({
        where: { key: 'ewallet_accounts' }
      });

      if (!ewalletAccountsSetting) {
        return res.status(404).json({ error: 'Pengaturan e-wallet tidak ditemukan' });
      }

      let ewalletAccounts = ewalletAccountsSetting.getParsedValue();

      if (index < 0 || index >= ewalletAccounts.length) {
        return res.status(404).json({ error: 'Akun e-wallet tidak ditemukan' });
      }

      // Remove e-wallet account
      ewalletAccounts.splice(index, 1);

      await ewalletAccountsSetting.update({
        value: JSON.stringify(ewalletAccounts)
      });

      res.json({ message: 'Akun e-wallet berhasil dihapus', ewalletAccounts });

    } catch (error) {
      console.error('Error deleting e-wallet account:', error);
      res.status(500).json({ error: 'Gagal menghapus akun e-wallet' });
    }
  }
};

module.exports = settingsController;
