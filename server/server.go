package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	big "github.com/nikkolasg/gmp"
	"github.com/nikkolasg/slog"
)

type ModExp struct {
	Base string `json="base"`
	Exp  string `json="exp"`
}

type Request struct {
	Modulo  string   `json="modulo"`
	Modexps []ModExp `json="modexps"`
}

type Response struct {
	Results []string `json="results"`
}

func modexpSplit(w http.ResponseWriter, r *http.Request) {
	var request Request
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var response = &Response{Results: make([]string, len(request.Modexps))}
	modulo := atoi(request.Modulo)
	//log("modulo: ", modulo.Text(16))
	for i, req := range request.Modexps {
		base := atoi(req.Base)
		exp := atoi(req.Exp)
		result := computeExponentiation(base, exp, modulo)
		//log(": base : ", base.Text(16))
		//log(": exp[", i, "] = ", exp.Text(16))
		//log(": result[", i, "] = ", result.Text(16))
		response.Results[i] = itoa(result)
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(200)
}

func computeExponentiation(base, exp, modulo *big.Int) *big.Int {
	return new(big.Int).Exp(base, exp, modulo)
}

// atoi assumes base16
func atoi(n string) *big.Int {
	i := new(big.Int)
	var ok bool
	i, ok = i.SetString(n, 16)
	if !ok {
		panic("stg's wrong about this number")
	}
	return i
}

func itoa(n *big.Int) string {
	return n.Text(16)
}

func log(a ...interface{}) {
	slog.Print(append([]interface{}{"[", address, "] "}, a...))
}

var address string

func main() {
	if len(os.Args) < 2 {
		panic("call that binary with an adress to listen on")
	}
	address = os.Args[1]
	r := mux.NewRouter()
	r.Methods("POST").Path("/modexp/split").HandlerFunc(modexpSplit)
	origins := handlers.AllowedOrigins([]string{"*"})
	headers := handlers.AllowedHeaders([]string{"Authorization", "Origin", "X-Requested-With", "Content-Type", "Accept"})
	methods := handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS"})
	corsed := handlers.CORS(origins, headers, methods)(r)
	loggedRouter := handlers.LoggingHandler(os.Stdout, corsed)
	fmt.Println("listening on ", os.Args[1])
	http.ListenAndServe(address, loggedRouter)
}
