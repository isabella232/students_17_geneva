.PHONY: FORCE lenny all clean distclean

FILE=main

all: 
	pdflatex $(FILE).tex
	bibtex $(FILE).aux
	pdflatex $(FILE).tex
	pdflatex $(FILE).tex

clean:
	for ext in aux log toc lof lot lol dlog bbl \
		nav snm fls vrb blg out tpt fdb_latexmk; \
	do \
		$(RM) $(FILE).$$ext ; \
	done
	$(RM) *.aux *.bak *~

distclean: clean
	$(RM) $(FILE).pdf
	$(RM) $(FILE).ps
	$(RM) $(FILE).dvi
	$(RM) *.d
