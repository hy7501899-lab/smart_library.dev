# Smart Library – Backend (Flask + SQLite)

## التشغيل

```bash
python -m venv venv
venv\Scripts\activate          # Windows   (Linux/Mac: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # Linux/Mac: cp .env.example .env
```

افتح `.env` وحط:
- `GEMINI_API_KEY` – مفتاح Gemini للشات بوت
- `SECRET_KEY` – أي نص عشوائي طويل (بيوقّع توكن الدخول):
  `python -c "import secrets; print(secrets.token_hex(32))"`

```bash
python app.py
```
افتح http://localhost:10000 — قاعدة البيانات `library.db` بتتعمل لوحدها أول تشغيل ومعاها 8 كتب.

> حط ملف الفيديو `854417-uhd_3840_2160_25fps.mp4` جنب `home.html` عشان خلفية الصفحة الرئيسية تظهر.

## لو الصفحة اتفتحت من Live Server أو من الملف مباشرة
الفرونت بيدوّر على السيرفر لوحده: لو الصفحة مش جاية من Flask بيكلم `http://localhost:10000`.
المهم إن `python app.py` يكون شغال. لما تنشر المشروع خلّي `ALLOW_LOCAL_FRONTEND=false` في `.env`،
ولو الفرونت على دومين تاني حط الدومين في `CORS_ORIGINS`.

## الـ API

| Method | Path | وصف | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | `{name,email,password}` ← `{token,user}` | لا |
| POST | `/api/auth/login` | `{email,password}` ← `{token,user}` | لا |
| GET / PUT | `/api/me` | بيانات الحساب (`name,email,phone`) | نعم |
| GET | `/api/categories` | التصنيفات مع عدد الكتب في كل واحد | لا |
| GET | `/api/categories/<slug>/books` | كتب تصنيف معين (`programming`, `artificial-intelligence`, `design`, `data-science`, `business`, `technology`) | لا |
| GET | `/api/books?q=&category=` | الكتالوج (التصنيف بالـ slug أو الاسم) | لا |
| GET | `/api/books/<id>` | كتاب واحد | لا |
| GET / POST | `/api/me/books` | كتبي / إضافة `{book_id}` (بتسجّل سجل دفع) | نعم |
| DELETE | `/api/me/books/<id>` | حذف من كتبي | نعم |
| GET / POST | `/api/me/favorites` | المفضلة / إضافة `{book_id}` | نعم |
| DELETE | `/api/me/favorites/<id>` | حذف من المفضلة | نعم |
| GET | `/api/me/payments` | سجل المدفوعات | نعم |
| POST | `/api/chat` | الشات بوت `{message}` (الكتالوج بيتقرا من الداتابيز) | لا |
| GET | `/api/health` | حالة السيرفر | لا |

التوكن بيتبعت في الهيدر: `Authorization: Bearer <token>` وصلاحيته 7 أيام.

## الملفات
- `app.py` – الـ routes والمصادقة والشات بوت
- `database.py` – الجداول (users, books, user_books, favorites, payments) وبيانات الكتب الأولية
- `session.js` – دوال مشتركة للفرونت (`api()` + إدارة التوكن + النافبار)
