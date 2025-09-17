/**
 * Script pour alimenter la base de connaissances Fataplus
 * Utilise Vectorize pour AutoRAG
 */

const knowledgeBase = [
  {
    id: "weather-prediction-madagascar",
    content: "Madagascar has distinct wet and dry seasons. The rainy season runs from November to April, with cyclone risk from January to March. Rice planting is optimal during October-November before rains begin.",
    metadata: { category: "weather", region: "madagascar", crop: "rice" }
  },
  {
    id: "zebu-cattle-management", 
    content: "Zebu cattle are well-adapted to Madagascar's climate. Vaccination schedule: FMD every 6 months, anthrax annually. Best grazing during dry season May-October. Monitor for tick-borne diseases.",
    metadata: { category: "livestock", animal: "zebu", region: "madagascar" }
  },
  {
    id: "cassava-cultivation",
    content: "Cassava thrives in Madagascar's sandy soils. Plant during September-November. Harvest after 8-12 months. Resistant to drought but susceptible to cassava mosaic virus. Intercrop with legumes.",
    metadata: { category: "crops", crop: "cassava", region: "madagascar" }
  },
  {
    id: "rice-cultivation-techniques",
    content: "Rice is Madagascar's staple crop. SRI (System of Rice Intensification) method increases yields by 50%. Plant single seedlings 25cm apart. Maintain 2-5cm water depth. Alternate wetting and drying.",
    metadata: { category: "crops", crop: "rice", technique: "sri", region: "madagascar" }
  },
  {
    id: "market-timing-agriculture",
    content: "Best market timing in Madagascar: Rice prices peak during lean season (December-March). Cassava prices stable year-round. Vanilla export season April-September. Monitor Antananarivo market trends.",
    metadata: { category: "market", region: "madagascar", timing: "seasonal" }
  }
];

console.log("Base de connaissances Fataplus créée:");
console.log(`${knowledgeBase.length} entrées de connaissances agricoles`);
console.log("Catégories: weather, livestock, crops, market");
console.log("Prêt pour AutoRAG avec Vectorize");
