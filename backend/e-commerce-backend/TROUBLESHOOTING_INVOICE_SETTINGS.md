# 🔧 Guide de Dépannage - Paramètres de Facturation

## Problèmes Courants et Solutions

### ❌ Erreur "Failed to save settings"

#### Cause 1: Token d'authentification incorrect
**Symptôme:** Erreur 401 ou 403 lors de la sauvegarde

**Solution:**
1. Vérifiez que vous êtes connecté en tant qu'admin
2. Vérifiez que le token est stocké sous `authToken` (pas `token`)
3. Vérifiez que le token n'a pas expiré

**Code corrigé:**
```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('authToken')}` // ✅ Correct
  // 'Authorization': `Bearer ${localStorage.getItem('token')}`  // ❌ Incorrect
}
```

#### Cause 2: Base de données non mise à jour
**Symptôme:** Erreur 500 lors de la sauvegarde

**Solution:**
1. Exécutez le script de mise à jour de la base de données:
```bash
cd backend/e-commerce-backend
node update-invoice-settings.js
```

2. Ou exécutez le script SQL directement:
```sql
-- Ajouter les champs fiscaux
ALTER TABLE invoice_settings 
ADD COLUMN IF NOT EXISTS fiscal_number VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS tax_registration_number VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS siret_number VARCHAR(255) DEFAULT '';
```

#### Cause 3: Dossier d'upload manquant
**Symptôme:** Erreur lors de l'upload de logo

**Solution:**
```bash
cd backend/e-commerce-backend
node check-uploads.js
```

### ❌ Erreur "jwt malformed"

#### Cause: Token JWT corrompu ou mal formaté
**Symptôme:** Erreur d'authentification persistante

**Solutions:**
1. **Déconnexion/Reconnexion:**
   - Déconnectez-vous de l'application
   - Supprimez le token du localStorage
   - Reconnectez-vous

2. **Vérifiez le format du token:**
   ```javascript
   // Dans la console du navigateur
   const token = localStorage.getItem('authToken');
   console.log('Token:', token);
   console.log('Token length:', token?.length);
   ```

3. **Vérifiez l'expiration:**
   ```javascript
   // Décoder le token pour vérifier l'expiration
   const token = localStorage.getItem('authToken');
   if (token) {
     try {
       const payload = JSON.parse(atob(token.split('.')[1]));
       console.log('Token expires:', new Date(payload.exp * 1000));
       console.log('Current time:', new Date());
     } catch (e) {
       console.log('Token is invalid');
     }
   }
   ```

### ❌ Erreur "Failed to upload logo"

#### Cause 1: Permissions de dossier insuffisantes
**Solution:**
```bash
# Sur Windows (PowerShell en tant qu'administrateur)
icacls "backend\e-commerce-backend\uploads" /grant "Users":(OI)(CI)F

# Sur Linux/Mac
chmod -R 755 backend/e-commerce-backend/uploads
```

#### Cause 2: Taille de fichier trop importante
**Solution:**
- Vérifiez que l'image fait moins de 5MB
- Compressez l'image si nécessaire
- Utilisez des formats optimisés (PNG, JPG)

#### Cause 3: Type de fichier non supporté
**Solution:**
- Utilisez uniquement des images (PNG, JPG, GIF)
- Vérifiez l'extension du fichier

## 🧪 Tests de Diagnostic

### Test 1: Vérifier l'authentification
```bash
cd backend/e-commerce-backend
node test-auth.js
```

### Test 2: Vérifier la base de données
```bash
cd backend/e-commerce-backend
node update-invoice-settings.js
```

### Test 3: Vérifier les dossiers d'upload
```bash
cd backend/e-commerce-backend
node check-uploads.js
```

## 🔍 Vérifications Frontend

### 1. Vérifier le token dans le localStorage
```javascript
// Dans la console du navigateur
console.log('Auth Token:', localStorage.getItem('authToken'));
console.log('Token exists:', !!localStorage.getItem('authToken'));
```

### 2. Vérifier les requêtes réseau
1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet Network
3. Essayez de sauvegarder les paramètres
4. Vérifiez la requête PUT vers `/api/settings/invoice`
5. Vérifiez les headers d'autorisation

### 3. Vérifier les erreurs de console
```javascript
// Ajoutez ce code temporairement pour le débogage
const handleSave = async () => {
  try {
    const token = localStorage.getItem('authToken');
    console.log('Token:', token);
    console.log('Token type:', typeof token);
    console.log('Token length:', token?.length);
    
    // ... reste du code
  } catch (error) {
    console.error('Save error details:', error);
  }
};
```

## 🚀 Solutions Rapides

### Solution 1: Redémarrage complet
1. Arrêtez le serveur backend
2. Arrêtez le serveur frontend
3. Redémarrez le serveur backend
4. Redémarrez le serveur frontend
5. Reconnectez-vous

### Solution 2: Nettoyage du cache
1. Videz le localStorage: `localStorage.clear()`
2. Videz le cache du navigateur
3. Reconnectez-vous

### Solution 3: Vérification de la base de données
1. Vérifiez que PostgreSQL est en cours d'exécution
2. Vérifiez la connexion à la base de données
3. Vérifiez que la table `invoice_settings` existe

## 📞 Support

Si les problèmes persistent:
1. Vérifiez les logs du serveur backend
2. Vérifiez les erreurs de la console du navigateur
3. Vérifiez les erreurs de la base de données
4. Documentez les étapes de reproduction

## ✅ Checklist de Vérification

- [ ] Serveur backend en cours d'exécution sur le port 3001
- [ ] Base de données PostgreSQL accessible
- [ ] Table `invoice_settings` mise à jour avec les champs fiscaux
- [ ] Dossier `uploads/logos` existe et est accessible en écriture
- [ ] Token d'authentification valide et non expiré
- [ ] Headers d'autorisation corrects dans les requêtes
- [ ] Pas d'erreurs CORS
- [ ] Taille des fichiers d'upload < 5MB
