#!/usr/bin/env node

/**
 * Script pour convertir le fichier CSV de toutes les tâches en format compatible API
 */

const fs = require('fs');
const path = require('path');

// Chemin vers le fichier CSV
const csvPath = path.join(__dirname, 'specs', 'all_tasks_by_category.csv');

// Fonction pour parser le CSV
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const tasks = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;

    // Parse la ligne CSV (gestion basique des virgules dans les guillemets)
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length >= 5) {
      const [specification, category, taskId, description, status, parallelizable, estimateDays] = values;
      
      // Mapping des statuts CSV vers notre format
      const statusMapping = {
        'Completed': 'completed',
        'Pending': 'pending',
        'Planned': 'pending',
        'In Progress': 'in_progress'
      };

      // Mapping des catégories vers des priorités
      const categoryPriorityMapping = {
        'Infrastructure Setup': 'high',
        'Authentication & Security': 'high',
        'Database & Core Models': 'high',
        'Core API Development': 'high',
        'Deployment & Production': 'medium',
        'Frontend Development': 'medium',
        'Integration & Testing': 'medium',
        'AI Services Integration': 'medium',
        'Mobile App RAG Implementation': 'low',
        'Context Implementations': 'low',
        'Risk Mitigation': 'low',
        'Foundation Setup': 'medium',
        'Foundation': 'medium',
        'Core Features Development': 'medium',
        'Advanced Analytics': 'low',
        'Performance Optimization': 'medium',
        'Testing and Quality Assurance': 'medium',
        'Launch Preparation': 'high'
      };

      // Déterminer la priorité basée sur la catégorie
      let priority = 'medium';
      for (const [cat, prio] of Object.entries(categoryPriorityMapping)) {
        if (category.includes(cat)) {
          priority = prio;
          break;
        }
      }

      // Ajustement spécial pour les tâches terminées - priorité haute
      if (statusMapping[status] === 'completed') {
        priority = 'high';
      }

      const task = {
        id: taskId || `task-${i}`,
        content: description,
        status: statusMapping[status] || 'pending',
        priority: priority,
        category: category.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-'),
        specification: specification,
        parallelizable: parallelizable === 'Yes',
        estimateDays: estimateDays || null,
        created: new Date().toISOString()
      };

      // Ajouter la date de completion pour les tâches terminées
      if (task.status === 'completed') {
        task.completed = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      tasks.push(task);
    }
  }

  return tasks;
}

// Fonction pour analyser les statistiques
function analyzeStats(tasks) {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    byCategory: {},
    bySpecification: {},
    byPriority: {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    }
  };

  // Statistiques par catégorie
  tasks.forEach(task => {
    if (!stats.byCategory[task.category]) {
      stats.byCategory[task.category] = { total: 0, completed: 0, pending: 0, in_progress: 0 };
    }
    stats.byCategory[task.category].total++;
    stats.byCategory[task.category][task.status]++;
  });

  // Statistiques par spécification
  tasks.forEach(task => {
    if (!stats.bySpecification[task.specification]) {
      stats.bySpecification[task.specification] = { total: 0, completed: 0, pending: 0, in_progress: 0 };
    }
    stats.bySpecification[task.specification].total++;
    stats.bySpecification[task.specification][task.status]++;
  });

  return stats;
}

// Exécution principale
async function main() {
  try {
    console.log('🔍 Lecture du fichier CSV...');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    console.log('📊 Parsing des tâches...');
    const tasks = parseCSV(csvContent);
    
    console.log('📈 Analyse des statistiques...');
    const stats = analyzeStats(tasks);
    
    console.log('\n📋 RÉSULTATS DE CONVERSION:');
    console.log('━'.repeat(50));
    console.log(`📚 Total des tâches: ${stats.total}`);
    console.log(`✅ Terminées: ${stats.completed} (${Math.round(stats.completed/stats.total*100)}%)`);
    console.log(`🔄 En cours: ${stats.in_progress} (${Math.round(stats.in_progress/stats.total*100)}%)`);
    console.log(`⏳ En attente: ${stats.pending} (${Math.round(stats.pending/stats.total*100)}%)`);
    
    console.log('\n🎯 Par priorité:');
    console.log(`  🔴 Haute: ${stats.byPriority.high}`);
    console.log(`  🟡 Moyenne: ${stats.byPriority.medium}`);
    console.log(`  🟢 Basse: ${stats.byPriority.low}`);
    
    console.log('\n📂 Top 10 catégories:');
    const sortedCategories = Object.entries(stats.byCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10);
    
    sortedCategories.forEach(([category, data]) => {
      const completionRate = Math.round(data.completed / data.total * 100);
      console.log(`  📁 ${category}: ${data.total} tâches (${completionRate}% terminées)`);
    });
    
    console.log('\n🏗️ Par spécification:');
    Object.entries(stats.bySpecification).forEach(([spec, data]) => {
      const completionRate = Math.round(data.completed / data.total * 100);
      console.log(`  🏷️  ${spec}: ${data.total} tâches (${completionRate}% terminées)`);
    });
    
    // Sauvegarder les tâches converties
    const outputPath = path.join(__dirname, 'converted-todos.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      tasks: tasks,
      stats: stats,
      metadata: {
        source: 'specs/all_tasks_by_category.csv',
        converted: new Date().toISOString(),
        version: '1.0.0'
      }
    }, null, 2));
    
    console.log(`\n💾 Tâches converties sauvegardées dans: ${outputPath}`);
    console.log(`\n🎉 Conversion terminée avec succès !`);
    
    return { tasks, stats };
    
  } catch (error) {
    console.error('❌ Erreur lors de la conversion:', error);
    process.exit(1);
  }
}

// Exporter pour utilisation en tant que module
if (require.main === module) {
  main();
} else {
  module.exports = { parseCSV, analyzeStats };
}