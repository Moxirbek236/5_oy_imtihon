# Base image
FROM node:20-alpine

# Ishchi katalog
WORKDIR /app

# Package.json fayllarini nusxalash
COPY package*.json ./

# Dependensiyalarni o'rnatish
RUN npm install

# Barcha kodlarni nusxalash
COPY . .

# Prisma generate (Majburiy qadam - DB connection ishlamasa ham client generate qilinadi)
RUN npx prisma generate

# Loyihani build qilish
RUN npm run build

# Portni ochish
EXPOSE 3000

# Ishga tushirish
CMD ["npm", "run", "start:render"]
