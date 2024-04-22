Welcome to the `kafdrop-search` wiki!

## How does it work?
`kafdrop-search` employs a heuristic binary search using the Kafdrop API.  

It works under the assumption that the record timestamps in the target Kafka topic are generally sorted in ascending order (or in other words, that the record timestamps are directly correlated to their offsets, i.e. the higher the offset - the higher the timestamp).  
If this is not true for your topic, `kafdrop-search` will unfortunately be useless.

Under this assumption, we can search for a given record timestamp using a heuristic search that performs binary search on the offsets,  
but compares the timestamps of the records.  
The core algorithm is roughly as follows (pseudo-code):
```
  - let the range of offsets be [min_offset, max_offset] in partition
  - let middle_offset be (min_offset + max_offset) / 2
  - let middle_message be message at middle_offset
  - if timestamp of middle_message > searched timestamp then:
     update range of offsets to [min_offset, middle_offset]
  - otherwise:
     update range of offsets to [middle_offset, max_offset]
  - and so on… until (max_offset - min_offset) <= KAFDROP_MAX_PAGE_SIZE
```
The maximal page size that the Kafdrop API allows to fetch (`KAFDROP_MAX_PAGE_SIZE`) is `100`, so the search stops  
once it focuses on a range of at most 100 records (with offsets `[min_offset ... max_offset]`).

At that point, we can fetch all 100 records, and check whether they contain a record with the requested key.  
If not, we can also check adjacent (backwards and forwards) pages (of 100 records each) until we either find the requested record or  
reach the maximal number of adjacent pages (controlled by the `Auto-scroll pages` setting).  

For example, if the initial search phase results in the offsets range `[1500, 1600]` and `Auto-scroll pages = 3`,  
then the order of checked ranges of offsets (i.e. adjacent pages) will be:  
`[1500, 1600]` - Original page  
`[1600, 1700]` - 1 page forward  
`[1400, 1500]` - 1 page backward  
`[1700, 1800]` - 2 pages forward  
`[1300, 1400]` - 2 pages backward  
`[1800, 1900]` - 3 pages forward  
`[1200, 1300]` - 3 pages backward  
