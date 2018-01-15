/*
 * =====================================================================================
 *
 *       Filename:  dice.c
 *
 *    Description:  
 *
 *        Version:  1.0
 *        Created:  12/21/2017 03:32:36 PM
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  nikkolasg (), nikkolasg@gmail.com
 *   Organization:  
 *
 * =====================================================================================
 */

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <time.h>
#include "gmp.h"
#include <emscripten/emscripten.h>

int main(int argc, char ** argv) {
    printf("WebAssembly module loaded\n");
}


void EMSCRIPTEN_KEEPALIVE printInt(char *hex) {
    mpz_t n;
    mpz_init(n);
    /*printf("printing INT at %p\n",hex);*/
    /*printf("printing INT value: %c\n",*hex);*/
    if (mpz_set_str(n,hex,16) != 0) {
        printf("hexadecimal invalid\n");
        return;
    }

    gmp_printf("printInt: %Zx\n",n);
    mpz_clear(n);
}

void EMSCRIPTEN_KEEPALIVE printIntMatrix(char **mat, int n) {
    for(int i = 0; i < n; i++) {
        printf("matrix[%d] => %p\n",i,mat[i]);
        printInt(mat[i]);
        printf("matrix[%d] => %p DONE\n",i,mat[i]);
    }
}


void EMSCRIPTEN_KEEPALIVE modexp(char *base, char *exp, char *modulo) {

    mpz_t baset;
    mpz_t expt; 
    mpz_t modt;
    mpz_t res;
    mpz_init(baset);
    mpz_init(expt);
    mpz_init(modt);
    mpz_init(res);

    if (mpz_set_str(baset,base,16) != 0) {
        printf("hexadecimal base invalid!");
        return;
    }

    if (mpz_set_str(expt,exp,16) != 0) {
        printf("hexadecimal exp invalid!");
        return;
}

    if (mpz_set_str(modt,modulo,16) != 0) {
        printf("hexadecimal modulo invalid!");
        return;
    }

    mpz_powm(res,baset,expt,modt);

   /* gmp_printf("modexp: base %Zx\n",baset);*/
    /*gmp_printf("modexp: exp %Zx\n",expt);*/
    /*gmp_printf("modexp: modt %Zx\n",modt);*/
    /*gmp_printf("modexp: res %Zx\n",res);*/
   
    mpz_clear(baset);
    mpz_clear(expt);
    mpz_clear(modt);
    mpz_clear(res);
}

// Matrix style with all bigints inside a matrix
// matrix is flattened as an array =>
// base_1, exp_1,  ... , base_n, exp_n, modulo
void EMSCRIPTEN_KEEPALIVE modexpMatrix(char** matrix, int n) {
     /*printf("modexpMatrix => HERE\n");*/
     char * modulo = matrix[n-1]; 
     for(int i = 0; i < n-1; i+= 2) {
         modexp(matrix[i],matrix[i+1],modulo);
     }

}


