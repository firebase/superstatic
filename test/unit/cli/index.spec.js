/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */

const _ = require("lodash");
const expect = require("chai").expect;
const fetch = require("node-fetch");
const fs = require("fs-extra");

const makecli = require("../../../lib/cli");
let server;

describe("cli", () => {
  let cli;

  const config = {
    public: "./"
  };

  beforeEach(() => {
    cli = makecli();

    fs.outputFileSync("superstatic.json", JSON.stringify(config), "utf-8");
    fs.outputFileSync(".tmp/superstatic.json", JSON.stringify(config), "utf-8");
    fs.outputFileSync(".tmp/index.html", ".tmp/index.html", "utf-8");
    fs.outputFileSync("index.html", "index", "utf-8");
  });

  afterEach(() => {
    fs.removeSync("superstatic.json");
    fs.removeSync("index.html");
    fs.removeSync(".tmp");
  });

  it("starts a server", (done) => {
    cli.run(["", ""], () => {
      server = cli.get("server");
      const port = cli.get("port");

      fetch("http://localhost:" + port)
        .then((res) => {
          expect(res.status).to.equal(200);
          res.text().then((body) => {
            expect(body).to.equal("index");
            server.close(done);
          });
        })
        .catch(done);
    });
  });

  it("starts a server with a given directory", (done) => {
    cli.run(["", "", ".tmp"], () => {
      server = cli.get("server");
      const port = cli.get("port");

      fetch("http://localhost:" + port)
        .then((res) => {
          expect(res.status).to.equal(200);
          res.text().then((body) => {
            expect(body).to.equal(".tmp/index.html");
            server.close(done);
          });
        })
        .catch(done);
    });
  });

  it("loads firebase.json config file", (done) => {
    fs.unlinkSync("superstatic.json");
    fs.writeFileSync(
      "firebase.json",
      JSON.stringify({
        public: ".tmp"
      }),
      "utf-8"
    );

    cli.run(["", ""], () => {
      server = cli.get("server");
      const port = cli.get("port");

      fetch("http://localhost:" + port)
        .then((res) => res.text())
        .then((body) => {
          expect(body).to.equal(".tmp/index.html");

          fs.unlinkSync("firebase.json");
          server.close(done);
        })
        .catch(done);
    });
  });

  describe("port", () => {
    it("--port", (done) => {
      cli.run(["", "", "--port", "4321"], () => {
        server = cli.get("server");
        const port = cli.get("port");

        fetch("http://localhost:" + port)
          .then(() => {
            expect(port).to.equal(4321);
            server.close(done);
          })
          .catch(done);
      });
    });

    it("-p", (done) => {
      cli.run(["", "", "-p", "4321"], () => {
        server = cli.get("server");
        const port = cli.get("port");

        fetch("http://localhost:" + port)
          .then(() => {
            expect(port).to.equal(4321);
            server.close(done);
          })
          .catch(done);
      });
    });
  });

  describe("starts server on host", () => {
    it("--host", (done) => {
      cli.run(["", "", "--host", "0.0.0.0"], () => {
        server = cli.get("server");

        expect(server.address().address).to.equal("0.0.0.0");
        server.close(done);
      });
    });

    it("--hostname", (done) => {
      cli.run(["", "", "--hostname", "0.0.0.0"], () => {
        server = cli.get("server");

        expect(server.address().address).to.equal("0.0.0.0");
        server.close(done);
      });
    });
  });

  it("enables log output", (done) => {
    cli.run(["", "", "--debug"], () => {
      const app = cli.get("app");
      const hasLogger = _.find(app.stack, (layer) => {
        return layer.handle && layer.handle.name === "logger";
      });

      expect(cli.get("debug")).to.equal(true);
      expect(!!hasLogger).to.equal(true);
      cli.get("server").close(done);
    });
  });

  it("supports the old --gzip flag", (done) => {
    cli.run(["", "", "--gzip"], () => {
      expect(cli.get("compression")).to.equal(true);
      cli.get("server").close(done);
    });
  });

  it("enables smart compression", (done) => {
    cli.run(["", "", "--compression"], () => {
      expect(cli.get("compression")).to.equal(true);
      cli.get("server").close(done);
    });
  });

  describe("uses custom config", () => {
    beforeEach(() => {
      fs.writeFileSync(
        "custom.json",
        JSON.stringify(
          {
            public: "./",
            rewrites: [
              {
                source: "**",
                destination: "/index.html"
              }
            ]
          },
          null,
          2
        ),
        "utf-8"
      );
    });

    afterEach(() => {
      fs.unlinkSync("custom.json");
    });

    it("--config", (done) => {
      cli.run(["", "", "--config", "custom.json"], () => {
        fetch("http://localhost:3474/anything.html")
          .then((res) => res.text())
          .then((body) => {
            expect(body).to.equal("index");
            expect(cli.get("config")).to.equal("custom.json");

            cli.get("server").close(done);
          })
          .catch(done);
      });
    });

    it("-c", (done) => {
      cli.run(["", "", "-c", "custom.json"], () => {
        fetch("http://localhost:3474/anything.html")
          .then((res) => res.text())
          .then((body) => {
            expect(body).to.equal("index");
            expect(cli.get("config")).to.equal("custom.json");

            cli.get("server").close(done);
          })
          .catch(done);
      });
    });

    it("uses custom config object", (done) => {
      cli.run(
        [
          "",
          "",
          "--config",
          JSON.stringify({
            rewrites: [
              {
                source: "**",
                destination: "/index.html"
              }
            ]
          })
        ],
        () => {
          fetch("http://localhost:3474/anything.html")
            .then((res) => res.text())
            .then((body) => {
              expect(body).to.equal("index");
              cli.get("server").close(done);
            })
            .catch(done);
        }
      );
    });
  });

  // NOTE: can't test flags that exit
  // This should be fixed in Nash 2.0
  it.skip("version flag", (done) => {
    // stdMocks.use();

    cli.run(["", "", "-v"], () => {
      // stdMocks.restore();
      // var output = stdMocks.flush();

      done();
    });
  });

  it("restarts the server if the config file is changed");

  // describe.skip('installing services', function() {

  //   it('locally');
  //   it('globally');
  // });

  describe.skip("services", () => {});
});
