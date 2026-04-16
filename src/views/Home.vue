<template>
  <div class="home">
    <h2>欢迎来到校园二手物品发布平台</h2>
    <p>这是一个专为校园学生设计的二手物品交易平台，您可以在这里发布和购买各种二手物品。</p>
    <div class="features">
      <div class="feature-card">
        <h3>发布物品</h3>
        <p>轻松发布您的二手物品，上传图片和详细描述</p>
      </div>
      <div class="feature-card">
        <h3>浏览物品</h3>
        <p>浏览各种二手物品，找到您需要的宝贝</p>
      </div>
      <div class="feature-card">
        <h3>安全交易</h3>
        <p>校园内交易，安全可靠</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}

.home h2 {
  margin-bottom: 1rem;
  color: #4CAF50;
}

.home p {
  margin-bottom: 2rem;
  font-size: 1.1rem;
  color: #666;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: #4CAF50;
}

.feature-card p {
  color: #666;
  margin: 0;
}
</style>
