#!/usr/bin/env node

/**
 * Script to populate the AutoRAG knowledge base with agricultural data
 * This will add embeddings to the Vectorize index for better AI responses
 */

const agriculturalKnowledge = [
  {
    id: "crop-rotation-basics",
    title: "Crop Rotation Fundamentals",
    content: "Crop rotation is a sustainable farming practice that involves growing different types of crops in the same area across seasons. Benefits include improved soil health, reduced pest and disease pressure, enhanced nutrient cycling, and better weed management. Common rotations include legumes followed by cereals, or cash crops alternated with cover crops.",
    category: "sustainable-farming",
    tags: ["crop-rotation", "soil-health", "sustainability"]
  },
  {
    id: "soil-ph-management",
    title: "Soil pH and Nutrient Management",
    content: "Soil pH affects nutrient availability and plant health. Most crops prefer pH 6.0-7.0. Acidic soils (pH < 6.0) may need lime application, while alkaline soils (pH > 7.5) may need sulfur or organic matter. Regular soil testing helps determine optimal fertilization strategies and prevents nutrient deficiencies or toxicities.",
    category: "soil-management",
    tags: ["soil-ph", "nutrients", "fertilization"]
  },
  {
    id: "integrated-pest-management",
    title: "Integrated Pest Management (IPM)",
    content: "IPM combines biological, cultural, physical, and chemical tools to manage pests sustainably. Key principles include prevention through healthy soil and plant selection, monitoring pest populations, using beneficial insects, applying targeted treatments only when necessary, and rotating control methods to prevent resistance.",
    category: "pest-management",
    tags: ["ipm", "biological-control", "pest-monitoring"]
  },
  {
    id: "water-conservation-techniques",
    title: "Water Conservation in Agriculture",
    content: "Efficient water use includes drip irrigation, mulching, rainwater harvesting, and drought-resistant crops. Soil moisture monitoring helps optimize irrigation timing. Cover crops and organic matter improve water retention. Proper drainage prevents waterlogging while conservation tillage reduces evaporation.",
    category: "water-management",
    tags: ["irrigation", "drought-resistance", "water-conservation"]
  },
  {
    id: "livestock-nutrition-basics",
    title: "Livestock Nutrition Fundamentals",
    content: "Balanced livestock nutrition requires protein, carbohydrates, fats, vitamins, minerals, and water. Feed quality affects animal health, reproduction, and production. Pasture management, feed testing, and supplementation ensure nutritional needs are met. Body condition scoring helps monitor animal health and adjust feeding programs.",
    category: "livestock",
    tags: ["animal-nutrition", "pasture-management", "feed-quality"]
  },
  {
    id: "organic-farming-principles",
    title: "Organic Farming Methods",
    content: "Organic agriculture emphasizes natural processes, biodiversity, and ecological balance. Key practices include composting, beneficial insects, crop rotation, cover crops, and avoiding synthetic pesticides/fertilizers. Certification requires transitional periods and compliance with organic standards for soil, pest, and weed management.",
    category: "organic-farming",
    tags: ["organic-certification", "composting", "biodiversity"]
  },
  {
    id: "greenhouse-climate-control",
    title: "Greenhouse Environmental Management",
    content: "Successful greenhouse production requires controlling temperature, humidity, CO2, and light. Ventilation systems, heating/cooling, and irrigation automation optimize growing conditions. Monitoring systems track environmental parameters. Proper plant spacing and air circulation prevent disease while maximizing production.",
    category: "protected-agriculture",
    tags: ["greenhouse-management", "climate-control", "automation"]
  },
  {
    id: "farm-financial-planning",
    title: "Agricultural Financial Management",
    content: "Farm profitability requires budgeting, cash flow management, and cost analysis. Key metrics include cost per unit, profit margins, and return on investment. Diversification, insurance, and market analysis help manage risks. Record keeping supports decision-making and tax preparation. Financial planning considers seasonal variations and investment needs.",
    category: "farm-management",
    tags: ["financial-planning", "profitability", "risk-management"]
  }
];

/**
 * Populate the Vectorize index with agricultural knowledge
 */
async function populateKnowledgeBase() {
  const WORKER_URL = 'https://fataplus-api.fenohery.workers.dev';
  
  console.log('🌱 Populating AutoRAG knowledge base with agricultural data...\n');
  
  for (const knowledge of agriculturalKnowledge) {
    try {
      console.log(`📚 Adding: ${knowledge.title}`);
      
      // Add to vectorize index via our API endpoint
      const response = await fetch(`${WORKER_URL}/api/knowledge/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(knowledge)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Successfully added "${knowledge.title}"`);
      } else {
        console.log(`❌ Failed to add "${knowledge.title}": ${response.status} ${response.statusText}`);
        const error = await response.text();
        console.log(`   Error: ${error}`);
      }
      
      // Add small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ Error adding "${knowledge.title}": ${error.message}`);
    }
  }
  
  console.log('\n🎉 Knowledge base population completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Total documents: ${agriculturalKnowledge.length}`);
  console.log(`   - Categories: ${[...new Set(agriculturalKnowledge.map(k => k.category))].join(', ')}`);
  console.log('\n🤖 AutoRAG is now ready to provide intelligent agricultural assistance!');
}

// Run the population script
populateKnowledgeBase().catch(console.error);