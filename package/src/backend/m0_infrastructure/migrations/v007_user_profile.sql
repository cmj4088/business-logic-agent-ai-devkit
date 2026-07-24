-- v007 用户资料扩展：添加头像字段
ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '';
