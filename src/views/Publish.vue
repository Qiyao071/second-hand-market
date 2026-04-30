<template>
  <div class="container">
    <h2>发布物品</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="title">物品标题 *</label>
        <input type="text" id="title" v-model="form.title" required placeholder="例如：九成新高等数学教材">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="category">物品分类 *</label>
          <select id="category" v-model="form.category" required>
            <option value="">请选择分类</option>
            <option value="书籍">书籍</option>
            <option value="电子产品">电子产品</option>
            <option value="生活用品">生活用品</option>
            <option value="服装">服装</option>
            <option value="家具">家具</option>
            <option value="运动器材">运动器材</option>
            <option value="其他">其他</option>
          </select>
        </div>

        <div class="form-group">
          <label for="condition">新旧程度 *</label>
          <select id="condition" v-model="form.condition" required>
            <option value="">请选择</option>
            <option value="全新">全新</option>
            <option value="几乎全新">几乎全新</option>
            <option value="轻微使用痕迹">轻微使用痕迹</option>
            <option value="有明显使用痕迹">有明显使用痕迹</option>
            <option value="待修复">待修复</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="price">价格（元） *</label>
        <input type="number" id="price" v-model.number="form.price" required min="0" step="0.01" placeholder="0.00">
      </div>

      <div class="form-group">
        <label for="description">物品描述 *</label>
        <textarea id="description" v-model="form.description" required rows="5" placeholder="详细描述物品的品牌、型号、购买时间、使用情况等信息"></textarea>
      </div>

      <div class="form-group">
        <label for="contact">联系方式（选填）</label>
        <input type="text" id="contact" v-model="form.contact" placeholder="手机号、微信、QQ等">
      </div>

      <div class="form-group">
        <label>物品图片（最多9张）</label>
        <div class="image-upload">
          <input type="file" id="images" multiple @change="handleImageUpload" accept="image/*">
          <p class="hint">支持 JPG、PNG 格式，每张图片大小不超过 5MB</p>
        </div>
        <div class="image-preview" v-if="imagePreviews.length > 0">
          <div v-for="(preview, index) in imagePreviews" :key="index" class="preview-item">
            <img :src="preview" alt="预览图">
            <button type="button" @click="removeImage(index)" class="remove-btn">×</button>
          </div>
        </div>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? '发布中...' : '发布物品' }}
      </button>

      <p class="error" v-if="error">{{ error }}</p>
      <p class="success" v-if="success">{{ success }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const form = ref({
  title: '',
  category: '',
  condition: '',
  price: '',
  description: '',
  contact: ''
})
const images = ref([])
const imagePreviews = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleImageUpload = (event) => {
  const files = event.target.files
  if (!files) return

  if (images.value.length + files.length > 9) {
    error.value = '最多只能上传9张图片'
    return
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.size > 5 * 1024 * 1024) {
      error.value = '单张图片大小不能超过5MB'
      return
    }

    images.value.push(file)
    imagePreviews.value.push(URL.createObjectURL(file))
  }
  error.value = ''
}

const removeImage = (index) => {
  images.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

const handleSubmit = async () => {
  error.value = ''
  success.value = ''

  if (!form.value.title || !form.value.category || !form.value.condition || !form.value.price || !form.value.description) {
    error.value = '请填写所有必填项'
    return
  }

  loading.value = true

  try {
    const formData = new FormData()
    formData.append('title', form.value.title)
    formData.append('category', form.value.category)
    formData.append('condition', form.value.condition)
    formData.append('price', form.value.price)
    formData.append('description', form.value.description)
    formData.append('contact', form.value.contact)

    for (let i = 0; i < images.value.length; i++) {
      formData.append('images', images.value[i])
    }

    const token = localStorage.getItem('token')
    const response = await axios.post('/api/items', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    success.value = '物品发布成功！'
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (err) {
    error.value = err.response?.data?.message || '发布失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 2rem;
  color: #4CAF50;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

input[type="text"],
input[type="number"],
textarea,
select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #4CAF50;
}

.image-upload {
  margin-bottom: 1rem;
}

.hint {
  font-size: 0.9rem;
  color: #666;
  margin: 0.5rem 0 0 0;
}

.image-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.preview-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 24px;
  padding: 0;
}

.remove-btn:hover {
  background-color: #ff7875;
}

button[type="submit"] {
  width: 100%;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1rem;
}

button[type="submit"]:hover:not(:disabled) {
  background-color: #45a049;
}

button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error {
  color: #ff4d4f;
  margin-top: 1rem;
  text-align: center;
}

.success {
  color: #4CAF50;
  margin-top: 1rem;
  text-align: center;
}
</style>