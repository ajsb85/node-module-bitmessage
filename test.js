var expect = require("chai").expect;
var bitmessage = require("./lib");
var Address = bitmessage.Address;
var varint = require("./lib/varint");
var bmcrypto = require("./lib/crypto");

describe("var_int", function() {
  it("should decode", function() {
    var res;
    expect(varint.decode.bind(null, Buffer([]))).to.throw(Error);
    expect(varint.decode.bind(null, Buffer("fd00", "hex"))).to.throw(Error);

    res = varint.decode(Buffer([123]));
    expect(res.value).to.equal(123);
    expect(res.length).to.equal(1);
    expect(res.rest.toString("hex")).to.equal("")

    res = varint.decode(Buffer("fd123456", "hex"));
    expect(res.value).to.equal(0x1234);
    expect(res.length).to.equal(3);
    expect(res.rest.toString("hex")).to.equal("56");

    res = varint.decode(Buffer("fe1234567890", "hex"));
    expect(res.value).to.equal(0x12345678);
    expect(res.length).to.equal(5);
    expect(res.rest.toString("hex")).to.equal("90");

    res = varint.decode(Buffer("ff0000001234567890", "hex"));
    expect(res.value == 0x1234567890).to.be.true;
    expect(res.length).to.equal(9);
    expect(res.rest.length).to.equal(0);
  });

  it("should check for lowest length on decode", function() {
    expect(varint.decode.bind(null, Buffer("fd00fc", "hex"))).to.throw(Error);
    expect(varint.decode.bind(null, Buffer("fe0000ffff", "hex"))).to.throw(Error);
    expect(varint.decode.bind(null, Buffer("ff00000000ffffffff", "hex"))).to.throw(Error);
  });
});

describe("Crypto", function() {
  it("should implement SHA-512 hash", function() {
    return bmcrypto.sha512(Buffer("test")).then(function(res) {
      expect(res.toString("hex")).to.equal("ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff");
    });
  });

  it("should implement SHA-256 hash", function() {
    return bmcrypto.sha256(Buffer("test")).then(function(res) {
      expect(res.toString("hex")).to.equal("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
    });
  });

  it("should implement RIPEMD-160 hash", function() {
    return bmcrypto.ripemd160(Buffer("test")).then(function(res) {
      expect(res.toString("hex")).to.equal("5e52fee47e6b070565f74372468cdc699de89107");
    });
  });

  it("should implement cryptographically secure PRNG", function() {
    var size = 100;
    var rnd = bmcrypto.randomBytes(size);
    expect(Buffer.isBuffer(rnd)).to.be.true;
    expect(rnd.length).to.equal(size);
    // Very simple statistical test.
    var bytes = {};
    var sum = 0;
    var value;
    for (var i = 0; i < size; i++) {
      value = rnd[i];
      sum += value;
      if (!bytes[value]) {
        bytes[value] = 0;
      }
      bytes[value]++;
      expect(bytes[value]).to.be.below(7);
    }
    // Ideal sum = (255 / 2) * size = 12750
    expect(sum).to.be.above(10000);
    expect(sum).to.be.below(15000);
  });
});

describe("Address", function() {
  it("should decode Bitmessage address", function() {
    return Address.decode("BM-2cTux3PGRqHTEH6wyUP2sWeT4LrsGgy63z")
      .then(function(addr) {
        expect(addr.version).to.equal(4);
        expect(addr.stream).to.equal(1);
        expect(addr.ripe.toString("hex")).to.equal("003ab6655de4bd8c603eba9b00dd5970725fdd56");
      });
  });

  it("should decode Bitmessage address badly formatted", function() {
    return Address.decode("  2cTux3PGRqHTEH6wyUP2sWeT4LrsGgy63z ")
      .then(function(addr) {
        expect(addr.version).to.equal(4);
        expect(addr.stream).to.equal(1);
        expect(addr.ripe.toString("hex")).to.equal("003ab6655de4bd8c603eba9b00dd5970725fdd56");
      });
  });
});
