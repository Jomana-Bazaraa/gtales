import { test } from "node:test";
import assert from "node:assert/strict";
import { EMAIL_RE, egyptMobile } from "../contact";

test("Egyptian mobile numbers in the usual ways people type them", () => {
  for (const s of ["01012345678", "010 1234 5678", "+201012345678", "+20 101 234 5678", "00201512345678", "201112345678", "1212345678", "010-1234-5678"]) assert.match(egyptMobile(s) ?? "", /^01[0125]\d{8}$/, s);
  assert.equal(egyptMobile("+20 101 234 5678"), "01012345678");
});
test("not an Egyptian mobile", () => {
  for (const s of ["", "0101234567", "010123456789", "01312345678", "0223456789", "+447700900123", "abc01012345678", "mariam@gmail.com"]) assert.equal(egyptMobile(s), null, s);
});
test("email check", () => {
  assert.ok(EMAIL_RE.test("mariam@gmail.com"));
  assert.ok(!EMAIL_RE.test("01012345678"));
});
