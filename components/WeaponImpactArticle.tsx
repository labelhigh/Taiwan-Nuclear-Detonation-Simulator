import React from 'react';

const WeaponImpactArticle: React.FC = () => {
  return (
    <div className="text-gray-300 text-sm space-y-4 p-2">
      <p>
        核武器是人類創造的最具毀滅性的工具。其影響遠不止一次巨大的爆炸，而是涵蓋了多個層面，帶來立即和長期的災難。了解這些層面對於認識其不可估量的後果至關重要。
      </p>
      
      <div className="space-y-2">
        <h4 className="font-semibold text-red-400">一、瞬時效應 (爆炸後數秒內)</h4>
        <ul className="list-disc list-inside space-y-1 pl-2 text-gray-400">
          <li>
            <strong>強烈閃光與熱輻射:</strong> 爆炸產生比太陽亮數千倍的火球，可在數公里外造成永久性失明。釋放的巨大熱能會立即點燃可燃物，並對暴露的皮膚造成三度燒傷，引發大規模火災風暴 (Firestorm)。
          </li>
          <li>
            <strong>毀滅性衝擊波:</strong> 爆炸產生的高壓衝擊波以超音速向外擴散，能輕易夷平城市建築。絕大多數的直接死亡是由於建築物倒塌和被衝擊波拋出的高速碎片所致。
          </li>
        </ul>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-purple-400">二、後期效應 (爆炸後數分鐘至數年)</h4>
        <ul className="list-disc list-inside space-y-1 pl-2 text-gray-400">
          <li>
            <strong>放射性落塵:</strong> 爆炸將大量泥土和碎片吸入蘑菇雲，使其具有高度放射性。這些致命的放射性粒子會隨風飄散數百公里，污染土地、水源和食物鏈，導致急性輻射病、癌症和遺傳損傷，其影響可持續數十年。
          </li>
          <li>
            <strong>電磁脈衝 (EMP):</strong> 在高空引爆的核彈會產生強烈的電磁脈衝，摧毀大範圍內的電網和未經屏蔽的電子設備，使現代社會的基礎設施陷入癱瘓，救援行動變得極其困難。
          </li>
        </ul>
      </div>
      
      <p className="pt-2 border-t border-gray-700">
        總結而言，核武器的攻擊是無差別的，它不僅摧毀物理設施，更會透過放射性污染和基礎設施的崩潰，對生態系統和人類文明造成持久且不可逆轉的傷害。
      </p>
    </div>
  );
};

export default WeaponImpactArticle;
