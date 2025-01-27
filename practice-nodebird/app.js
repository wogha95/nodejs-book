const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const passport = require("passport");

const pageRouter = require("./routes/page");
const authRouter = require("./routes/auth");
const app = express();
const sequelize = require("./models").sequelize;
const passportConfig = require("./passport");

// .env 파일 설정
dotenv.config();

// 패스포트 설정
passportConfig();

// port 설정
app.set("port", process.env.PORT || 8001);

// view 관련 파일 설정
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

// DB 연결
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("데이터베이스 연결 성공");
  })
  .catch((err) => {
    console.error(err);
  });

// logger 설정
app.use(morgan("dev"));

// 파싱 관련 설정
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 쿠키, 세션 설정
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);

// passport 초기 설정 및 세션 연결
app.use(passport.initialize()); // req.user req.login req.logout req.isAuthenticated 자동 추가됨
app.use(passport.session()); // connect.sid 세션 쿠키가 브라우저로 전송됨

// view 라우터 설정
app.use("/", pageRouter);
app.use("/auth", authRouter);

// 404 처리 미들웨어
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

// 서버 실행
app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});
